#!/usr/bin/env python3
"""
Mini simulador de sistema de arquivos baseado em FAT16/FAT32.

Ele nao cria uma particao real; cria uma imagem JSON didatica com:
- metadados do volume;
- tabela FAT;
- clusters de dados;
- entradas de diretorio.
"""

from __future__ import annotations

import argparse
import base64
import json
import math
import os
import sys
from datetime import datetime, timezone
from pathlib import PurePosixPath
from typing import Any


FREE = 0
EOC = -1
RESERVED = -2

FAT16_MAX_CLUSTERS = 65_524
FAT32_PRACTICAL_MAX_CLUSTERS = 1_000_000
FAT16_ROOT_ENTRIES = 512


class FileSystemError(Exception):
    """Erro esperado de uso ou consistencia do mini sistema de arquivos."""


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def normalize_path(path: str) -> str:
    path = (path or "/").replace("\\", "/")
    if not path.startswith("/"):
        path = "/" + path

    parts: list[str] = []
    for part in path.split("/"):
        if not part or part == ".":
            continue
        if part == "..":
            if parts:
                parts.pop()
            continue
        parts.append(part)

    return "/" + "/".join(parts)


def path_parts(path: str) -> list[str]:
    normalized = normalize_path(path)
    if normalized == "/":
        return []
    return [part for part in normalized.split("/") if part]


def validate_name(name: str) -> None:
    if not name or name in {".", ".."}:
        raise FileSystemError("Nome invalido.")
    if "/" in name or "\\" in name:
        raise FileSystemError("O nome nao pode conter barras.")
    invalid = set('<>:"|?*')
    if any(char in invalid for char in name):
        raise FileSystemError('O nome contem caractere invalido: <>:"|?*')


class MiniFAT:
    def __init__(self, image: dict[str, Any]):
        self.image = image

    @classmethod
    def create(
        cls,
        fs_type: str = "FAT16",
        total_clusters: int = 256,
        cluster_size: int = 64,
    ) -> "MiniFAT":
        fs_type = fs_type.upper()
        if fs_type not in {"FAT16", "FAT32"}:
            raise FileSystemError("Use FAT16 ou FAT32.")
        if total_clusters < 1:
            raise FileSystemError("O volume precisa ter ao menos 1 cluster de dados.")
        if cluster_size < 1:
            raise FileSystemError("O tamanho do cluster precisa ser positivo.")
        if fs_type == "FAT16" and total_clusters > FAT16_MAX_CLUSTERS:
            raise FileSystemError(
                f"FAT16 suporta no maximo {FAT16_MAX_CLUSTERS} clusters nesta simulacao."
            )
        if fs_type == "FAT32" and total_clusters > FAT32_PRACTICAL_MAX_CLUSTERS:
            raise FileSystemError(
                f"Use ate {FAT32_PRACTICAL_MAX_CLUSTERS} clusters para manter a imagem pequena."
            )

        fat = [RESERVED, RESERVED] + [FREE] * total_clusters
        created_at = now_iso()

        if fs_type == "FAT16":
            root_key = "root"
            root_cluster = None
        else:
            root_cluster = 2
            root_key = str(root_cluster)
            fat[root_cluster] = EOC

        image = {
            "format": "mini-fat-v1",
            "metadata": {
                "fs_type": fs_type,
                "cluster_size": cluster_size,
                "total_clusters": total_clusters,
                "root_key": root_key,
                "root_cluster": root_cluster,
                "fat16_root_entries": FAT16_ROOT_ENTRIES,
                "created_at": created_at,
                "modified_at": created_at,
            },
            "fat": fat,
            "data": {},
            "directories": {root_key: {}},
        }
        return cls(image)

    @classmethod
    def load(cls, image_path: str) -> "MiniFAT":
        with open(image_path, "r", encoding="utf-8") as handle:
            image = json.load(handle)
        if image.get("format") != "mini-fat-v1":
            raise FileSystemError("Imagem nao reconhecida. Formate uma nova imagem.")
        return cls(image)

    def save(self, image_path: str) -> None:
        self.image["metadata"]["modified_at"] = now_iso()
        with open(image_path, "w", encoding="utf-8") as handle:
            json.dump(self.image, handle, indent=2, ensure_ascii=False)
            handle.write("\n")

    @property
    def metadata(self) -> dict[str, Any]:
        return self.image["metadata"]

    @property
    def fat(self) -> list[int]:
        return self.image["fat"]

    @property
    def data(self) -> dict[str, str]:
        return self.image["data"]

    @property
    def directories(self) -> dict[str, dict[str, Any]]:
        return self.image["directories"]

    @property
    def root_key(self) -> str:
        return self.metadata["root_key"]

    def _format_marker(self, value: int) -> str:
        fs_type = self.metadata["fs_type"]
        if value == FREE:
            return "FREE"
        if value == RESERVED:
            return "RESERVED"
        if value == EOC:
            return "0xFFFF" if fs_type == "FAT16" else "0x0FFFFFFF"
        return str(value)

    def _needed_clusters(self, payload: bytes) -> int:
        if not payload:
            return 0
        return math.ceil(len(payload) / self.metadata["cluster_size"])

    def _free_cluster_count(self) -> int:
        return sum(1 for index in range(2, len(self.fat)) if self.fat[index] == FREE)

    def _cluster_chain(self, start_cluster: int | None) -> list[int]:
        if start_cluster is None:
            return []

        chain: list[int] = []
        seen: set[int] = set()
        current = start_cluster

        while current not in seen:
            if current < 2 or current >= len(self.fat):
                raise FileSystemError("Cadeia FAT corrompida: cluster fora do volume.")
            chain.append(current)
            seen.add(current)
            next_cluster = self.fat[current]
            if next_cluster == EOC:
                return chain
            if next_cluster in {FREE, RESERVED}:
                raise FileSystemError("Cadeia FAT corrompida: ponteiro inesperado.")
            current = next_cluster

        raise FileSystemError("Cadeia FAT corrompida: ciclo detectado.")

    def _allocate_chain(self, payload: bytes) -> int | None:
        needed = self._needed_clusters(payload)
        if needed == 0:
            return None

        free_clusters = [
            index for index in range(2, len(self.fat)) if self.fat[index] == FREE
        ]
        if len(free_clusters) < needed:
            raise FileSystemError("Espaco insuficiente no volume.")

        cluster_size = self.metadata["cluster_size"]
        chain = free_clusters[:needed]
        for position, cluster in enumerate(chain):
            next_cluster = chain[position + 1] if position + 1 < len(chain) else EOC
            self.fat[cluster] = next_cluster
            chunk = payload[position * cluster_size : (position + 1) * cluster_size]
            self.data[str(cluster)] = base64.b64encode(chunk).decode("ascii")

        return chain[0]

    def _allocate_directory_cluster(self) -> int:
        for index in range(2, len(self.fat)):
            if self.fat[index] == FREE:
                self.fat[index] = EOC
                self.data.pop(str(index), None)
                return index
        raise FileSystemError("Espaco insuficiente para criar diretorio.")

    def _free_chain(self, start_cluster: int | None) -> None:
        if start_cluster is None:
            return
        for cluster in self._cluster_chain(start_cluster):
            self.fat[cluster] = FREE
            self.data.pop(str(cluster), None)

    def _read_chain(self, start_cluster: int | None, size: int) -> bytes:
        if start_cluster is None:
            return b""
        chunks = []
        for cluster in self._cluster_chain(start_cluster):
            encoded = self.data.get(str(cluster), "")
            chunks.append(base64.b64decode(encoded.encode("ascii")) if encoded else b"")
        return b"".join(chunks)[:size]

    def _ensure_can_add_entry(self, directory_key: str) -> None:
        if (
            self.metadata["fs_type"] == "FAT16"
            and directory_key == self.root_key
            and len(self.directories[directory_key]) >= self.metadata["fat16_root_entries"]
        ):
            raise FileSystemError("Diretorio raiz FAT16 atingiu o limite fixo de entradas.")

    def _resolve_directory_key(self, path: str) -> str:
        key = self.root_key
        for part in path_parts(path):
            entry = self.directories[key].get(part)
            if not entry or entry["type"] != "dir":
                raise FileSystemError(f"Diretorio nao encontrado: {normalize_path(path)}")
            key = str(entry["cluster"])
        return key

    def _resolve_parent(self, path: str) -> tuple[str, str]:
        parts = path_parts(path)
        if not parts:
            raise FileSystemError("A raiz nao pode ser usada nesta operacao.")
        parent_path = "/" + "/".join(parts[:-1])
        return self._resolve_directory_key(parent_path), parts[-1]

    def _entry_at(self, path: str) -> dict[str, Any]:
        normalized = normalize_path(path)
        if normalized == "/":
            return {
                "name": "/",
                "type": "dir",
                "cluster": self.metadata["root_cluster"],
                "root": True,
            }

        parent_key, name = self._resolve_parent(normalized)
        entry = self.directories[parent_key].get(name)
        if not entry:
            raise FileSystemError(f"Entrada nao encontrada: {normalized}")
        return entry

    def _directory_key_from_entry(self, entry: dict[str, Any]) -> str:
        if entry.get("root"):
            return self.root_key
        return str(entry["cluster"])

    def mkdir(self, path: str) -> None:
        parent_key, name = self._resolve_parent(path)
        validate_name(name)
        entries = self.directories[parent_key]
        if name in entries:
            raise FileSystemError("Ja existe uma entrada com esse nome.")

        self._ensure_can_add_entry(parent_key)
        cluster = self._allocate_directory_cluster()
        timestamp = now_iso()
        self.directories[str(cluster)] = {}
        entries[name] = {
            "name": name,
            "type": "dir",
            "cluster": cluster,
            "size": 0,
            "created_at": timestamp,
            "modified_at": timestamp,
        }

    def write_file(self, path: str, content: str, overwrite: bool = False) -> None:
        parent_key, name = self._resolve_parent(path)
        validate_name(name)
        entries = self.directories[parent_key]
        existing = entries.get(name)
        if existing and existing["type"] == "dir":
            raise FileSystemError("Nao e possivel escrever sobre um diretorio.")
        if existing and not overwrite:
            raise FileSystemError("Arquivo ja existe. Use sobrescrever/overwrite.")

        payload = content.encode("utf-8")
        existing_chain = []
        if existing:
            existing_chain = self._cluster_chain(existing["start_cluster"])
        if self._needed_clusters(payload) > self._free_cluster_count() + len(existing_chain):
            raise FileSystemError("Espaco insuficiente no volume.")

        if existing:
            self._free_chain(existing["start_cluster"])

        start_cluster = self._allocate_chain(payload)
        timestamp = now_iso()
        if existing:
            existing.update(
                {
                    "size": len(payload),
                    "start_cluster": start_cluster,
                    "modified_at": timestamp,
                }
            )
            return

        self._ensure_can_add_entry(parent_key)
        entries[name] = {
            "name": name,
            "type": "file",
            "size": len(payload),
            "start_cluster": start_cluster,
            "created_at": timestamp,
            "modified_at": timestamp,
        }

    def read_file(self, path: str) -> str:
        entry = self._entry_at(path)
        if entry["type"] != "file":
            raise FileSystemError("A entrada nao e um arquivo.")
        payload = self._read_chain(entry["start_cluster"], entry["size"])
        return payload.decode("utf-8")

    def append_file(self, path: str, content: str) -> None:
        old_content = self.read_file(path)
        self.write_file(path, old_content + content, overwrite=True)

    def replace_in_file(self, path: str, old: str, new: str) -> int:
        content = self.read_file(path)
        count = content.count(old)
        self.write_file(path, content.replace(old, new), overwrite=True)
        return count

    def _delete_entry(self, entry: dict[str, Any], recursive: bool) -> None:
        if entry["type"] == "file":
            self._free_chain(entry["start_cluster"])
            return

        directory_key = str(entry["cluster"])
        children = self.directories[directory_key]
        if children and not recursive:
            raise FileSystemError("Diretorio nao esta vazio. Use --recursive.")
        for child_name in list(children):
            child = children.pop(child_name)
            self._delete_entry(child, recursive=True)
        self.directories.pop(directory_key, None)
        self._free_chain(entry["cluster"])

    def remove(self, path: str, recursive: bool = False) -> None:
        parent_key, name = self._resolve_parent(path)
        entry = self.directories[parent_key].get(name)
        if not entry:
            raise FileSystemError("Entrada nao encontrada.")
        self._delete_entry(entry, recursive)
        del self.directories[parent_key][name]

    def rename(self, path: str, new_name: str) -> None:
        validate_name(new_name)
        parent_key, name = self._resolve_parent(path)
        entries = self.directories[parent_key]
        if name not in entries:
            raise FileSystemError("Entrada nao encontrada.")
        if new_name in entries:
            raise FileSystemError("Ja existe uma entrada com o novo nome.")
        entry = entries.pop(name)
        entry["name"] = new_name
        entry["modified_at"] = now_iso()
        entries[new_name] = entry

    def move(self, source: str, destination: str) -> None:
        source_norm = normalize_path(source)
        dest_norm = normalize_path(destination)
        source_parent_key, source_name = self._resolve_parent(source_norm)
        source_entries = self.directories[source_parent_key]
        entry = source_entries.get(source_name)
        if not entry:
            raise FileSystemError("Entrada de origem nao encontrada.")

        dest_parent_path = "/" + "/".join(path_parts(dest_norm)[:-1])
        dest_name = PurePosixPath(dest_norm).name
        try:
            dest_entry = self._entry_at(dest_norm)
            if dest_entry["type"] != "dir":
                raise FileSystemError("Destino ja existe e nao e um diretorio.")
            dest_parent_key = self._directory_key_from_entry(dest_entry)
            dest_parent_path = dest_norm
            dest_name = source_name
        except FileSystemError:
            dest_parent_key, dest_name = self._resolve_parent(dest_norm)

        validate_name(dest_name)
        if entry["type"] == "dir" and (
            dest_parent_path == source_norm or dest_parent_path.startswith(source_norm + "/")
        ):
            raise FileSystemError("Nao e possivel mover um diretorio para dentro dele mesmo.")

        dest_entries = self.directories[dest_parent_key]
        if dest_parent_key == source_parent_key and dest_name == source_name:
            return
        if dest_name in dest_entries:
            raise FileSystemError("Ja existe uma entrada no destino.")
        if dest_parent_key != source_parent_key:
            self._ensure_can_add_entry(dest_parent_key)

        entry = source_entries.pop(source_name)
        entry["name"] = dest_name
        entry["modified_at"] = now_iso()
        dest_entries[dest_name] = entry

    def list_dir(self, path: str = "/") -> list[str]:
        entry = self._entry_at(path)
        if entry["type"] != "dir":
            raise FileSystemError("A entrada nao e um diretorio.")
        directory_key = self._directory_key_from_entry(entry)
        entries = sorted(
            self.directories[directory_key].values(),
            key=lambda item: (item["type"] != "dir", item["name"].lower()),
        )
        lines = []
        for item in entries:
            if item["type"] == "dir":
                cluster = item["cluster"]
                lines.append(f"DIR  {item['name']:<24} cluster={cluster}")
            else:
                chain = self._cluster_chain(item["start_cluster"])
                cluster_text = "-" if item["start_cluster"] is None else str(item["start_cluster"])
                lines.append(
                    f"FILE {item['name']:<24} size={item['size']:<6} "
                    f"start={cluster_text:<4} clusters={len(chain)}"
                )
        return lines

    def tree(self, path: str = "/") -> list[str]:
        entry = self._entry_at(path)
        if entry["type"] != "dir":
            raise FileSystemError("A entrada nao e um diretorio.")

        lines = [normalize_path(path)]

        def walk(directory_key: str, prefix: str) -> None:
            entries = sorted(
                self.directories[directory_key].values(),
                key=lambda item: (item["type"] != "dir", item["name"].lower()),
            )
            for index, item in enumerate(entries):
                connector = "`-- " if index == len(entries) - 1 else "|-- "
                suffix = "/" if item["type"] == "dir" else ""
                lines.append(prefix + connector + item["name"] + suffix)
                if item["type"] == "dir":
                    extension = "    " if index == len(entries) - 1 else "|   "
                    walk(str(item["cluster"]), prefix + extension)

        walk(self._directory_key_from_entry(entry), "")
        return lines

    def info(self) -> list[str]:
        used = sum(1 for index in range(2, len(self.fat)) if self.fat[index] != FREE)
        free = self.metadata["total_clusters"] - used
        capacity = self.metadata["total_clusters"] * self.metadata["cluster_size"]
        marker = "16 bits" if self.metadata["fs_type"] == "FAT16" else "32 bits (28 uteis)"
        root = (
            "diretorio raiz fixo"
            if self.metadata["fs_type"] == "FAT16"
            else f"diretorio raiz em cluster {self.metadata['root_cluster']}"
        )
        return [
            f"Tipo: {self.metadata['fs_type']} ({marker})",
            f"Clusters: {self.metadata['total_clusters']} total, {used} usados, {free} livres",
            f"Tamanho do cluster: {self.metadata['cluster_size']} bytes",
            f"Capacidade didatica: {capacity} bytes",
            f"Raiz: {root}",
        ]

    def fat_view(self, limit: int = 64) -> list[str]:
        end = min(len(self.fat), 2 + limit)
        lines = []
        for index in range(2, end):
            lines.append(f"{index:>5}: {self._format_marker(self.fat[index])}")
        return lines


def load_or_create_for_format(args: argparse.Namespace) -> MiniFAT:
    if os.path.exists(args.image) and not args.force:
        raise FileSystemError("A imagem ja existe. Use --force para formatar novamente.")
    return MiniFAT.create(args.type, args.clusters, args.cluster_size)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Mini sistema de arquivos didatico baseado em FAT16/FAT32."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("demo", aliases=["teste"])
    subparsers.add_parser("frag", aliases=["fragmentacao", "fragmentation"])

    menu_cmd = subparsers.add_parser("menu", aliases=["manual", "interativo"])
    menu_cmd.add_argument("image", nargs="?", default="meu_disco.json")

    format_cmd = subparsers.add_parser("format", aliases=["formatar"])
    format_cmd.add_argument("image")
    format_cmd.add_argument("--type", choices=["FAT16", "FAT32"], default="FAT16")
    format_cmd.add_argument("--clusters", type=int, default=256)
    format_cmd.add_argument("--cluster-size", type=int, default=64)
    format_cmd.add_argument("--force", action="store_true")

    for command, aliases in [
        ("info", []),
        ("ls", ["listar"]),
        ("tree", ["arvore"]),
        ("fat", []),
    ]:
        cmd = subparsers.add_parser(command, aliases=aliases)
        cmd.add_argument("image")
        if command in {"ls", "tree"}:
            cmd.add_argument("path", nargs="?", default="/")
        if command == "fat":
            cmd.add_argument("--limit", type=int, default=64)

    mkdir_cmd = subparsers.add_parser("mkdir", aliases=["criar-pasta"])
    mkdir_cmd.add_argument("image")
    mkdir_cmd.add_argument("path")

    write_cmd = subparsers.add_parser("write", aliases=["escrever"])
    write_cmd.add_argument("image")
    write_cmd.add_argument("path")
    write_cmd.add_argument("content")

    overwrite_cmd = subparsers.add_parser("overwrite", aliases=["sobrescrever"])
    overwrite_cmd.add_argument("image")
    overwrite_cmd.add_argument("path")
    overwrite_cmd.add_argument("content")

    read_cmd = subparsers.add_parser("read", aliases=["ler"])
    read_cmd.add_argument("image")
    read_cmd.add_argument("path")

    append_cmd = subparsers.add_parser("append", aliases=["adicionar"])
    append_cmd.add_argument("image")
    append_cmd.add_argument("path")
    append_cmd.add_argument("content")

    replace_cmd = subparsers.add_parser("replace", aliases=["substituir"])
    replace_cmd.add_argument("image")
    replace_cmd.add_argument("path")
    replace_cmd.add_argument("old")
    replace_cmd.add_argument("new")

    rm_cmd = subparsers.add_parser("rm", aliases=["delete", "apagar"])
    rm_cmd.add_argument("image")
    rm_cmd.add_argument("path")
    rm_cmd.add_argument("--recursive", action="store_true")

    rename_cmd = subparsers.add_parser("rename", aliases=["renomear"])
    rename_cmd.add_argument("image")
    rename_cmd.add_argument("path")
    rename_cmd.add_argument("new_name")

    move_cmd = subparsers.add_parser("move", aliases=["mv", "mover"])
    move_cmd.add_argument("image")
    move_cmd.add_argument("source")
    move_cmd.add_argument("destination")

    return parser


def run_demo() -> int:
    print("=== DEMO SIMPLES DO MINI FAT ===")
    print()
    print("1) Criando uma imagem FAT16 pequena...")
    fs16 = MiniFAT.create("FAT16", total_clusters=12, cluster_size=4)
    fs16.mkdir("/docs")
    fs16.write_file("/docs/aula.txt", "abcdefghi")

    print("2) Lendo o arquivo /docs/aula.txt:")
    print("   " + fs16.read_file("/docs/aula.txt"))
    print()

    print("3) Mostrando a tabela FAT depois da escrita:")
    for line in fs16.fat_view(limit=8):
        print("   " + line)
    print("   Interpretacao: o arquivo ficou encadeado nos clusters 3 -> 4 -> 5.")
    print()

    print("4) Testando alterar conteudo:")
    fs16.append_file("/docs/aula.txt", " XYZ")
    fs16.replace_in_file("/docs/aula.txt", "abc", "ABC")
    print("   Depois de append + replace:")
    print("   " + fs16.read_file("/docs/aula.txt"))
    print()

    print("5) Testando renomear, mover e apagar:")
    fs16.rename("/docs/aula.txt", "arquivo.txt")
    fs16.move("/docs/arquivo.txt", "/arquivo.txt")
    print("   Arvore depois de mover:")
    for line in fs16.tree("/"):
        print("   " + line)
    fs16.remove("/arquivo.txt")
    print("   Arvore depois de apagar:")
    for line in fs16.tree("/"):
        print("   " + line)
    print()

    fs16.save("demo_fat16.json")
    print("6) Arquivo de exemplo salvo: demo_fat16.json")
    print()

    print("7) Criando uma imagem FAT32 para comparar...")
    fs32 = MiniFAT.create("FAT32", total_clusters=12, cluster_size=4)
    fs32.write_file("/teste.txt", "fat32")
    for line in fs32.info():
        print("   " + line)
    fs32.save("demo_fat32.json")
    print("   Arquivo de exemplo salvo: demo_fat32.json")
    print()

    print("Pronto. Se apareceu esta mensagem, o sistema esta funcionando.")
    return 0


def _print_fat_snapshot(fs: "MiniFAT", title: str, limit: int = 14) -> None:
    print(f"--- {title} ---")
    for line in fs.fat_view(limit=limit):
        print("   " + line)
    print()


def _print_chain_for(fs: "MiniFAT", path: str) -> None:
    entry = fs._entry_at(path)
    start = entry.get("start_cluster")
    if start is None:
        print(f"   {path}: vazio (sem clusters)")
        return
    chain = fs._cluster_chain(start)
    arrow = " -> ".join(str(c) for c in chain) + " -> FIM"
    print(f"   {path}: cadeia {arrow}  ({len(chain)} cluster(s))")


def run_frag_demo(interactive: bool = False) -> int:
    def step_pause(msg: str = "Pressione ENTER para o proximo passo...") -> None:
        if interactive:
            try:
                input(f"\n>>> {msg}")
                print()
            except EOFError:
                pass

    print("=== DEMO DE FRAGMENTACAO (ALOCACAO ENCADEADA) ===")
    print()
    print("Volume FAT16 com 10 clusters de 4 bytes.")
    print("Vamos forcar uma cadeia com 'buracos' para mostrar que")
    print("o arquivo NAO precisa ficar em clusters contiguos.")
    step_pause("Pressione ENTER para comecar o PASSO 1...")

    fs = MiniFAT.create("FAT16", total_clusters=10, cluster_size=4)

    print("PASSO 1: criar 3 arquivos pequenos em sequencia.")
    print("   /a.txt = 4 bytes  -> 1 cluster")
    print("   /b.txt = 8 bytes  -> 2 clusters")
    print("   /c.txt = 4 bytes  -> 1 cluster")
    fs.write_file("/a.txt", "AAAA")
    fs.write_file("/b.txt", "BBBBBBBB")
    fs.write_file("/c.txt", "CCCC")
    _print_fat_snapshot(fs, "FAT depois das 3 escritas")
    _print_chain_for(fs, "/a.txt")
    _print_chain_for(fs, "/b.txt")
    _print_chain_for(fs, "/c.txt")
    step_pause("Pressione ENTER para o PASSO 2 (apagar /b.txt)...")

    print("PASSO 2: apagar /b.txt -> libera clusters no MEIO da area.")
    fs.remove("/b.txt")
    _print_fat_snapshot(fs, "FAT depois de apagar /b.txt")
    print("   Clusters do meio agora aparecem como FREE.")
    print("   Repare: cluster 2 (a.txt) e cluster 5 (c.txt) seguem ocupados.")
    step_pause("Pressione ENTER para o PASSO 3 (gravar /grande.txt)...")

    print("PASSO 3: gravar /grande.txt ocupando 4 clusters.")
    print("   Alocador pega os FREE em ordem: primeiro os do meio (3, 4),")
    print("   depois os do final (6, 7). Resultado: cadeia FRAGMENTADA.")
    fs.write_file("/grande.txt", "1111222233334444")
    _print_fat_snapshot(fs, "FAT depois de gravar /grande.txt")
    _print_chain_for(fs, "/grande.txt")
    print("   Observe o salto: 4 -> 6 (pula o cluster 5, que e do c.txt).")
    step_pause("Pressione ENTER para o PASSO 4 (ler /grande.txt)...")

    print("PASSO 4: ler /grande.txt seguindo a cadeia.")
    print("   Conteudo:", fs.read_file("/grande.txt"))
    print("   Mesmo espalhado, a FAT reconstroi a ordem correta.")
    print()

    fs.save("demo_frag.json")
    print("Imagem salva em demo_frag.json para inspecao.")
    print("Abra o JSON e veja o array 'fat' com os ponteiros.")
    return 0


def ask_text(prompt: str, default: str | None = None) -> str:
    if default is None:
        shown_prompt = prompt if prompt.endswith((" ", ": ")) else f"{prompt}: "
    else:
        shown_prompt = f"{prompt} [{default}]: "
    answer = input(shown_prompt)
    answer = answer.strip()
    return answer if answer else (default or "")


def ask_int(prompt: str, default: int) -> int:
    while True:
        answer = ask_text(prompt, str(default))
        try:
            value = int(answer)
            if value > 0:
                return value
        except ValueError:
            pass
        print("Digite um numero inteiro positivo.")


def create_image_interactively(image_path: str) -> MiniFAT:
    print("Nenhuma imagem de disco foi encontrada.")
    print("Vamos criar uma agora.")
    print()
    print("Limites desta simulacao:")
    print(f"- FAT16: ate {FAT16_MAX_CLUSTERS} clusters")
    print(f"- FAT32: ate {FAT32_PRACTICAL_MAX_CLUSTERS} clusters")
    print()

    while True:
        choice = ask_text("Tipo do sistema (1 = FAT16, 2 = FAT32)", "1")
        if choice == "1":
            fs_type = "FAT16"
            break
        if choice == "2":
            fs_type = "FAT32"
            break
        print("Escolha 1 ou 2.")

    while True:
        clusters = ask_int("Quantidade de clusters", 128)
        cluster_size = ask_int("Tamanho de cada cluster em bytes", 32)
        try:
            fs = MiniFAT.create(fs_type, clusters, cluster_size)
            break
        except FileSystemError as exc:
            print(f"Erro: {exc}")
            print("Digite valores menores para continuar.")
    fs.save(image_path)
    print(f"Imagem criada: {image_path}")
    return fs


def open_image_for_menu(image_path: str) -> MiniFAT:
    if not os.path.exists(image_path):
        return create_image_interactively(image_path)

    print(f"Imagem encontrada: {image_path}")
    while True:
        print("1 - Abrir imagem existente")
        print("2 - Apagar e criar uma imagem nova")
        choice = ask_text("Escolha", "1")
        if choice == "1":
            return MiniFAT.load(image_path)
        if choice == "2":
            return create_image_interactively(image_path)
        print("Escolha 1 ou 2.")


def pause() -> None:
    input("\nPressione ENTER para continuar...")


def show_menu_options(image_path: str) -> None:
    print()
    print("=== MINI FAT - MODO MANUAL ===")
    print(f"Imagem atual: {image_path}")
    print()
    print(" 1 - Mostrar informacoes do disco")
    print(" 2 - Criar pasta")
    print(" 3 - Escrever arquivo novo")
    print(" 4 - Ler arquivo")
    print(" 5 - Sobrescrever arquivo")
    print(" 6 - Adicionar texto no final")
    print(" 7 - Substituir texto dentro do arquivo")
    print(" 8 - Renomear arquivo ou pasta")
    print(" 9 - Mover arquivo ou pasta")
    print("10 - Apagar arquivo ou pasta")
    print("11 - Listar uma pasta")
    print("12 - Mostrar arvore de arquivos")
    print("13 - Mostrar tabela FAT")
    print("14 - Salvar")
    print("15 - Demo de fragmentacao (alocacao encadeada)")
    print(" 0 - Sair")
    print()


def run_interactive_menu(image_path: str) -> int:
    fs = open_image_for_menu(image_path)

    while True:
        show_menu_options(image_path)
        choice = ask_text("Digite a opcao")

        try:
            if choice == "0":
                fs.save(image_path)
                print("Salvo. Ate mais.")
                return 0

            if choice == "1":
                print("\n".join(fs.info()))
                pause()

            elif choice == "2":
                path = ask_text("Caminho da pasta. Exemplo: /docs")
                fs.mkdir(path)
                fs.save(image_path)
                print("Pasta criada.")
                pause()

            elif choice == "3":
                path = ask_text("Caminho do arquivo. Exemplo: /docs/aula.txt")
                content = ask_text("Conteudo do arquivo")
                fs.write_file(path, content)
                fs.save(image_path)
                print("Arquivo criado.")
                pause()

            elif choice == "4":
                path = ask_text("Caminho do arquivo para ler")
                print()
                print(fs.read_file(path))
                pause()

            elif choice == "5":
                path = ask_text("Caminho do arquivo para sobrescrever")
                content = ask_text("Novo conteudo")
                fs.write_file(path, content, overwrite=True)
                fs.save(image_path)
                print("Arquivo sobrescrito.")
                pause()

            elif choice == "6":
                path = ask_text("Caminho do arquivo")
                content = ask_text("Texto para adicionar no final")
                fs.append_file(path, content)
                fs.save(image_path)
                print("Texto adicionado.")
                pause()

            elif choice == "7":
                path = ask_text("Caminho do arquivo")
                old = ask_text("Texto antigo")
                new = ask_text("Texto novo")
                count = fs.replace_in_file(path, old, new)
                fs.save(image_path)
                print(f"Substituicoes realizadas: {count}")
                pause()

            elif choice == "8":
                path = ask_text("Caminho atual")
                new_name = ask_text("Novo nome. Exemplo: novo.txt")
                fs.rename(path, new_name)
                fs.save(image_path)
                print("Renomeado.")
                pause()

            elif choice == "9":
                source = ask_text("Origem. Exemplo: /docs/aula.txt")
                destination = ask_text("Destino. Exemplo: /aula.txt ou /outra-pasta")
                fs.move(source, destination)
                fs.save(image_path)
                print("Movido.")
                pause()

            elif choice == "10":
                path = ask_text("Caminho para apagar")
                recursive = ask_text("Se for pasta com conteudo, apagar tudo? (s/n)", "n")
                fs.remove(path, recursive=recursive.lower().startswith("s"))
                fs.save(image_path)
                print("Apagado.")
                pause()

            elif choice == "11":
                path = ask_text("Pasta para listar", "/")
                lines = fs.list_dir(path)
                print("\n".join(lines) if lines else "(pasta vazia)")
                pause()

            elif choice == "12":
                path = ask_text("Pasta inicial", "/")
                print("\n".join(fs.tree(path)))
                pause()

            elif choice == "13":
                limit = ask_int("Quantos clusters mostrar", 30)
                print("\n".join(fs.fat_view(limit)))
                pause()

            elif choice == "14":
                fs.save(image_path)
                print("Salvo.")
                pause()

            elif choice == "15":
                print()
                run_frag_demo(interactive=True)
                print()
                print("A demo usou uma imagem separada (demo_frag.json).")
                print(f"Sua imagem atual ({image_path}) continua intacta.")
                pause()

            else:
                print("Opcao invalida.")
                pause()

        except FileSystemError as exc:
            print(f"Erro: {exc}")
            pause()


def run_command(args: argparse.Namespace) -> int:
    if args.command in {"demo", "teste"}:
        return run_demo()

    if args.command in {"frag", "fragmentacao", "fragmentation"}:
        return run_frag_demo()

    if args.command in {"menu", "manual", "interativo"}:
        return run_interactive_menu(args.image)

    if args.command in {"format", "formatar"}:
        fs = load_or_create_for_format(args)
        fs.save(args.image)
        print(f"Imagem {args.type} criada em {args.image}")
        return 0

    fs = MiniFAT.load(args.image)
    command = args.command

    if command in {"info"}:
        print("\n".join(fs.info()))
    elif command in {"ls", "listar"}:
        print("\n".join(fs.list_dir(args.path)))
    elif command in {"tree", "arvore"}:
        print("\n".join(fs.tree(args.path)))
    elif command == "fat":
        print("\n".join(fs.fat_view(args.limit)))
    elif command in {"mkdir", "criar-pasta"}:
        fs.mkdir(args.path)
        fs.save(args.image)
    elif command in {"write", "escrever"}:
        fs.write_file(args.path, args.content)
        fs.save(args.image)
    elif command in {"overwrite", "sobrescrever"}:
        fs.write_file(args.path, args.content, overwrite=True)
        fs.save(args.image)
    elif command in {"read", "ler"}:
        print(fs.read_file(args.path))
    elif command in {"append", "adicionar"}:
        fs.append_file(args.path, args.content)
        fs.save(args.image)
    elif command in {"replace", "substituir"}:
        count = fs.replace_in_file(args.path, args.old, args.new)
        fs.save(args.image)
        print(f"Substituicoes realizadas: {count}")
    elif command in {"rm", "delete", "apagar"}:
        fs.remove(args.path, recursive=args.recursive)
        fs.save(args.image)
    elif command in {"rename", "renomear"}:
        fs.rename(args.path, args.new_name)
        fs.save(args.image)
    elif command in {"move", "mv", "mover"}:
        fs.move(args.source, args.destination)
        fs.save(args.image)
    else:
        raise FileSystemError("Comando desconhecido.")

    return 0


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return run_command(args)
    except FileSystemError as exc:
        print(f"Erro: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
