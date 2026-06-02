import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pptxgenPath =
  "C:/Users/faisc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/pptxgenjs@4.0.1/node_modules/pptxgenjs/dist/pptxgen.cjs.js";
const require = createRequire(import.meta.url);
const pptxgen = require(pptxgenPath);

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pptx.author = "Turma 60 - Sistemas Operacionais";
pptx.title = "FAT16 e FAT32";
pptx.lang = "pt-BR";
pptx.theme = { headFontFace: "Georgia", bodyFontFace: "Calibri", lang: "pt-BR" };

const OUT = path.join(__dirname, "Apresentacao_FAT16_FAT32.pptx");

// Modern white/grey palette (matches TCC template feel)
const C = {
  bg: "FFFFFF",
  ink: "1F2937",      // near-black for titles
  body: "374151",     // dark grey body
  muted: "6B7280",    // mid grey
  line: "E5E7EB",     // light grey divider
  panel: "F9FAFB",    // subtle panel fill
  accent: "111827",   // strong black accent
  chip: "F3F4F6",
};

const W = 13.333, H = 7.5;

function pageFrame(slide, { showFooter = true, pageNum = null, totalPages = 10 } = {}) {
  slide.background = { color: C.bg };
  // top-left wordmark
  slide.addText("FAT16 · FAT32", {
    x: 0.6, y: 0.35, w: 5, h: 0.3,
    fontFace: "Calibri", fontSize: 10, bold: true, color: C.muted, charSpacing: 4,
  });
  // top-right course tag
  slide.addText("Sistemas Operacionais  ·  Turma 60", {
    x: W - 6.6, y: 0.35, w: 6, h: 0.3,
    fontFace: "Calibri", fontSize: 10, color: C.muted, align: "right",
  });
  if (showFooter) {
    slide.addShape(pptx.ShapeType.line, {
      x: 0.6, y: H - 0.55, w: W - 1.2, h: 0,
      line: { color: C.line, width: 0.75 },
    });
    if (pageNum !== null) {
      slide.addText(`${String(pageNum).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`, {
        x: W - 1.6, y: H - 0.45, w: 1, h: 0.3,
        fontFace: "Calibri", fontSize: 9, color: C.muted, align: "right",
      });
    }
  }
}

function addTitle(slide, kicker, title) {
  if (kicker) {
    slide.addText(kicker.toUpperCase(), {
      x: 0.6, y: 1.0, w: 10, h: 0.35,
      fontFace: "Calibri", fontSize: 11, bold: true, color: C.muted, charSpacing: 6,
    });
  }
  slide.addText(title, {
    x: 0.6, y: 1.4, w: 12, h: 0.9,
    fontFace: "Georgia", fontSize: 32, bold: true, color: C.ink,
  });
}

// ---------- Slide 1 — Capa ----------
{
  const s = pptx.addSlide();
  s.background = { color: C.bg };
  // large side panel (grey)
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 4.2, h: H, fill: { color: C.panel }, line: { color: C.panel } });
  // vertical thin marker
  s.addShape(pptx.ShapeType.rect, { x: 4.2, y: 0, w: 0.04, h: H, fill: { color: C.ink }, line: { color: C.ink } });

  s.addText("APRESENTAÇÃO", {
    x: 0.6, y: 0.7, w: 3.5, h: 0.4,
    fontFace: "Calibri", fontSize: 11, bold: true, color: C.muted, charSpacing: 6,
  });
  s.addText("Sistemas\nOperacionais", {
    x: 0.6, y: 2.8, w: 3.5, h: 2,
    fontFace: "Georgia", italic: true, fontSize: 24, color: C.ink, lineSpacingMultiple: 1.1,
  });
  s.addText("Turma 60  ·  2026", {
    x: 0.6, y: H - 1.1, w: 3.5, h: 0.4,
    fontFace: "Calibri", fontSize: 10, color: C.muted, charSpacing: 4,
  });

  s.addText("FAT16 & FAT32", {
    x: 4.9, y: 2.4, w: 8.2, h: 1.4,
    fontFace: "Georgia", fontSize: 60, bold: true, color: C.ink,
  });
  s.addText("Sistemas de Arquivos da família FAT", {
    x: 4.9, y: 3.9, w: 8.2, h: 0.6,
    fontFace: "Calibri", fontSize: 20, color: C.body,
  });
  s.addShape(pptx.ShapeType.line, {
    x: 4.9, y: 4.7, w: 1.2, h: 0,
    line: { color: C.ink, width: 2 },
  });
  s.addText("Organização, armazenamento e recuperação de arquivos em mídias removíveis.", {
    x: 4.9, y: 4.9, w: 7.8, h: 0.8,
    fontFace: "Calibri", fontSize: 13, color: C.muted, italic: true,
  });

  s.addNotes(
    "Hoje vamos apresentar dois sistemas de arquivos da família FAT: o FAT16 e o FAT32. " +
    "Eles foram muito usados em sistemas Windows, pen drives, cartões de memória e dispositivos simples."
  );
}

// ---------- Slide 2 — O que é Sistema de Arquivos ----------
{
  const s = pptx.addSlide();
  pageFrame(s, { pageNum: 2 });
  addTitle(s, "Conceito", "O que é um sistema de arquivos?");

  s.addText(
    "Forma como o sistema operacional organiza, salva, encontra e apaga arquivos em um dispositivo de armazenamento.",
    { x: 0.6, y: 2.5, w: 6.2, h: 1.6, fontFace: "Calibri", fontSize: 16, color: C.body, lineSpacingMultiple: 1.3 }
  );

  // Right card: example
  s.addShape(pptx.ShapeType.rect, {
    x: 7.2, y: 2.5, w: 5.5, h: 3.8,
    fill: { color: C.panel }, line: { color: C.line, width: 0.75 },
  });
  s.addText("Exemplo — salvar foto no pen drive", {
    x: 7.45, y: 2.65, w: 5.1, h: 0.4,
    fontFace: "Calibri", fontSize: 12, bold: true, color: C.muted, charSpacing: 3,
  });
  s.addText(
    [
      { text: "onde a foto será gravada\n", options: { bullet: { code: "2022" } } },
      { text: "como o nome será armazenado\n", options: { bullet: { code: "2022" } } },
      { text: "quais blocos do disco ela ocupa\n", options: { bullet: { code: "2022" } } },
      { text: "como recuperá-la depois", options: { bullet: { code: "2022" } } },
    ],
    { x: 7.55, y: 3.2, w: 4.9, h: 2.9, fontFace: "Calibri", fontSize: 15, color: C.ink, paraSpaceAfter: 8 }
  );

  s.addNotes(
    "Um sistema de arquivos é a forma como o SO organiza, salva, encontra e apaga arquivos. " +
    "Quando você salva uma foto no pen drive, ele decide onde gravar, como nomear, quais blocos ocupar e como recuperar depois."
  );
}

// ---------- Slide 3 — O que é FAT ----------
{
  const s = pptx.addSlide();
  pageFrame(s, { pageNum: 3 });
  addTitle(s, "Sigla", "O que é FAT?");

  s.addText("File Allocation Table", {
    x: 0.6, y: 2.4, w: 7, h: 0.6,
    fontFace: "Georgia", italic: true, fontSize: 22, color: C.ink,
  });
  s.addText("Tabela de Alocação de Arquivos", {
    x: 0.6, y: 2.95, w: 7, h: 0.4,
    fontFace: "Calibri", fontSize: 14, color: C.muted,
  });
  s.addText(
    "Guarda a sequência de clusters usados por cada arquivo.",
    { x: 0.6, y: 3.7, w: 6.2, h: 0.8, fontFace: "Calibri", fontSize: 16, color: C.body }
  );

  // Right card: example chain
  s.addShape(pptx.ShapeType.rect, {
    x: 7.4, y: 2.4, w: 5.3, h: 3.9,
    fill: { color: C.panel }, line: { color: C.line, width: 0.75 },
  });
  s.addText("trabalho.pdf  —  cluster inicial: 5", {
    x: 7.6, y: 2.55, w: 5, h: 0.4,
    fontFace: "Consolas", fontSize: 12, bold: true, color: C.muted,
  });
  s.addText(
    "5  →  6\n6  →  9\n9  →  FIM",
    { x: 7.6, y: 3.1, w: 5, h: 2.2, fontFace: "Consolas", fontSize: 26, color: C.ink, lineSpacingMultiple: 1.2 }
  );
  s.addText("Arquivo ocupa clusters 5, 6 e 9.", {
    x: 7.6, y: 5.5, w: 5, h: 0.5,
    fontFace: "Calibri", italic: true, fontSize: 12, color: C.muted,
  });

  s.addNotes(
    "FAT = File Allocation Table (Tabela de Alocação de Arquivos). " +
    "A FAT guarda a sequência de clusters de cada arquivo. " +
    "No exemplo, trabalho.pdf começa no cluster 5 e segue 5→6→9→FIM."
  );
}

// ---------- Slide 4 — FAT16 ----------
{
  const s = pptx.addSlide();
  pageFrame(s, { pageNum: 4 });
  addTitle(s, "Primeira versão", "FAT16");

  s.addText(
    "Versão antiga da família FAT. Muito usada no MS-DOS, em versões antigas do Windows e em dispositivos com pouco armazenamento.",
    { x: 0.6, y: 2.45, w: 12, h: 1, fontFace: "Calibri", fontSize: 15, color: C.body, lineSpacingMultiple: 1.3 }
  );

  // 2x2 grid of chars
  const items = [
    ["Entradas de 16 bits", "Cada referência de cluster usa 2 bytes."],
    ["Simples e compatível", "Suportado por praticamente qualquer SO."],
    ["Ideal para mídias pequenas", "Funcionava bem nos discos da época."],
    ["Limitações de tamanho", "Partições pequenas e clusters grandes em discos maiores."],
  ];
  const cw = 5.95, ch = 1.5, gx = 0.6, gy = 3.7, gap = 0.25;
  items.forEach((it, i) => {
    const r = Math.floor(i / 2), c = i % 2;
    const x = gx + c * (cw + gap);
    const y = gy + r * (ch + gap);
    s.addShape(pptx.ShapeType.rect, { x, y, w: cw, h: ch, fill: { color: C.panel }, line: { color: C.line, width: 0.75 } });
    s.addText(`0${i + 1}`, {
      x: x + 0.2, y: y + 0.15, w: 0.8, h: 0.3,
      fontFace: "Georgia", fontSize: 11, italic: true, color: C.muted,
    });
    s.addText(it[0], {
      x: x + 0.2, y: y + 0.4, w: cw - 0.4, h: 0.45,
      fontFace: "Calibri", fontSize: 15, bold: true, color: C.ink,
    });
    s.addText(it[1], {
      x: x + 0.2, y: y + 0.85, w: cw - 0.4, h: 0.6,
      fontFace: "Calibri", fontSize: 11, color: C.muted,
    });
  });

  s.addNotes(
    "O FAT16 era bom para a época em que os discos eram pequenos. " +
    "Quando os HDs começaram a crescer, ele passou a ter limitações importantes de tamanho e desperdício de espaço."
  );
}

// ---------- Slide 5 — FAT32 ----------
{
  const s = pptx.addSlide();
  pageFrame(s, { pageNum: 5 });
  addTitle(s, "Evolução", "FAT32");

  s.addText(
    "Evolução do FAT16. Permite muito mais clusters e, portanto, partições maiores.",
    { x: 0.6, y: 2.45, w: 12, h: 0.8, fontFace: "Calibri", fontSize: 15, color: C.body, lineSpacingMultiple: 1.3 }
  );

  const items = [
    ["Entradas de 32 bits", "28 bits úteis para endereçamento."],
    ["Volumes maiores", "Suporta partições muito acima do FAT16."],
    ["Alta compatibilidade", "Windows, Linux, macOS, câmeras, consoles, TVs."],
    ["Limite de 4 GB por arquivo", "Não armazena arquivos individuais acima desse limite."],
  ];
  const cw = 5.95, ch = 1.5, gx = 0.6, gy = 3.5, gap = 0.25;
  items.forEach((it, i) => {
    const r = Math.floor(i / 2), c = i % 2;
    const x = gx + c * (cw + gap);
    const y = gy + r * (ch + gap);
    s.addShape(pptx.ShapeType.rect, { x, y, w: cw, h: ch, fill: { color: C.panel }, line: { color: C.line, width: 0.75 } });
    s.addText(`0${i + 1}`, {
      x: x + 0.2, y: y + 0.15, w: 0.8, h: 0.3,
      fontFace: "Georgia", fontSize: 11, italic: true, color: C.muted,
    });
    s.addText(it[0], {
      x: x + 0.2, y: y + 0.4, w: cw - 0.4, h: 0.45,
      fontFace: "Calibri", fontSize: 15, bold: true, color: C.ink,
    });
    s.addText(it[1], {
      x: x + 0.2, y: y + 0.85, w: cw - 0.4, h: 0.6,
      fontFace: "Calibri", fontSize: 11, color: C.muted,
    });
  });

  s.addNotes(
    "O FAT32 resolveu uma limitação importante do FAT16: o tamanho das partições. " +
    "Ficou muito popular em pen drives e cartões de memória. " +
    "Tem uma limitação famosa: não armazena arquivos individuais maiores que cerca de 4 GB."
  );
}

// ---------- Slide 6 — Estrutura de diretórios ----------
{
  const s = pptx.addSlide();
  pageFrame(s, { pageNum: 6 });
  addTitle(s, "Organização", "Estrutura de diretórios");

  s.addText("Cada arquivo tem uma entrada de diretório com:", {
    x: 0.6, y: 2.5, w: 6.2, h: 0.5, fontFace: "Calibri", fontSize: 14, color: C.body,
  });
  s.addText(
    [
      { text: "nome do arquivo\n", options: { bullet: { code: "2022" } } },
      { text: "extensão\n", options: { bullet: { code: "2022" } } },
      { text: "atributos (somente leitura, oculto, …)\n", options: { bullet: { code: "2022" } } },
      { text: "data e hora\n", options: { bullet: { code: "2022" } } },
      { text: "primeiro cluster\n", options: { bullet: { code: "2022" } } },
      { text: "tamanho", options: { bullet: { code: "2022" } } },
    ],
    { x: 0.7, y: 3.05, w: 6.2, h: 3, fontFace: "Calibri", fontSize: 14, color: C.ink, paraSpaceAfter: 6 }
  );

  // Right comparison panel
  s.addShape(pptx.ShapeType.rect, {
    x: 7.4, y: 2.5, w: 5.3, h: 3.7,
    fill: { color: C.panel }, line: { color: C.line, width: 0.75 },
  });
  s.addText("Diretório raiz", {
    x: 7.6, y: 2.65, w: 5, h: 0.4,
    fontFace: "Calibri", fontSize: 11, bold: true, color: C.muted, charSpacing: 4,
  });
  s.addText("FAT16", {
    x: 7.6, y: 3.1, w: 5, h: 0.4,
    fontFace: "Georgia", fontSize: 16, bold: true, color: C.ink,
  });
  s.addText("tamanho fixo e limitado", {
    x: 7.6, y: 3.5, w: 5, h: 0.4,
    fontFace: "Calibri", fontSize: 13, color: C.body,
  });
  s.addShape(pptx.ShapeType.line, {
    x: 7.6, y: 4.1, w: 4.9, h: 0,
    line: { color: C.line, width: 0.75 },
  });
  s.addText("FAT32", {
    x: 7.6, y: 4.25, w: 5, h: 0.4,
    fontFace: "Georgia", fontSize: 16, bold: true, color: C.ink,
  });
  s.addText("flexível — cadeia de clusters, como qualquer outro diretório", {
    x: 7.6, y: 4.65, w: 4.9, h: 1,
    fontFace: "Calibri", fontSize: 13, color: C.body,
  });

  s.addNotes(
    "Cada arquivo tem uma entrada de diretório com nome, extensão, atributos, data/hora, primeiro cluster e tamanho. " +
    "No FAT16 o diretório raiz é fixo e limitado. No FAT32 ele é flexível, funciona como cadeia de clusters."
  );
}

// ---------- Slide 7 — Alocação ----------
{
  const s = pptx.addSlide();
  pageFrame(s, { pageNum: 7 });
  addTitle(s, "Método", "Alocação de espaço");

  s.addText("Alocação encadeada por tabela", {
    x: 0.6, y: 2.4, w: 8, h: 0.5,
    fontFace: "Georgia", italic: true, fontSize: 18, color: C.ink,
  });
  s.addText("O arquivo pode estar espalhado em vários clusters. A FAT indica a ordem.", {
    x: 0.6, y: 2.95, w: 8, h: 0.6, fontFace: "Calibri", fontSize: 14, color: C.muted,
  });

  // example
  s.addShape(pptx.ShapeType.rect, {
    x: 0.6, y: 3.7, w: 6, h: 1.3,
    fill: { color: C.panel }, line: { color: C.line, width: 0.75 },
  });
  s.addText("foto.jpg", {
    x: 0.8, y: 3.8, w: 5.6, h: 0.35,
    fontFace: "Consolas", fontSize: 11, color: C.muted,
  });
  s.addText("20  →  21  →  30  →  31  →  FIM", {
    x: 0.8, y: 4.15, w: 5.6, h: 0.7,
    fontFace: "Consolas", fontSize: 20, bold: true, color: C.ink,
  });

  // pros / cons
  s.addText("Vantagem", {
    x: 7.4, y: 2.4, w: 5.3, h: 0.4,
    fontFace: "Calibri", fontSize: 11, bold: true, color: C.muted, charSpacing: 4,
  });
  s.addText("Simples de implementar.", {
    x: 7.4, y: 2.8, w: 5.3, h: 0.5, fontFace: "Calibri", fontSize: 15, color: C.ink,
  });
  s.addText("Desvantagens", {
    x: 7.4, y: 3.6, w: 5.3, h: 0.4,
    fontFace: "Calibri", fontSize: 11, bold: true, color: C.muted, charSpacing: 4,
  });
  s.addText(
    [
      { text: "fragmentação\n", options: { bullet: { code: "2022" } } },
      { text: "FAT corrompida → perda de referência\n", options: { bullet: { code: "2022" } } },
      { text: "menos eficiente que NTFS, ext4, APFS", options: { bullet: { code: "2022" } } },
    ],
    { x: 7.5, y: 4.0, w: 5.2, h: 2.3, fontFace: "Calibri", fontSize: 14, color: C.body, paraSpaceAfter: 6 }
  );

  s.addNotes(
    "FAT16 e FAT32 usam alocação encadeada por tabela. " +
    "Vantagem: simplicidade. Desvantagens: fragmentação, vulnerabilidade à corrupção da FAT e menor eficiência que sistemas modernos."
  );
}

// ---------- Slide 8 — Recuperação ----------
{
  const s = pptx.addSlide();
  pageFrame(s, { pageNum: 8 });
  addTitle(s, "Confiabilidade", "Recuperação de dados");

  s.addText("Sem journaling", {
    x: 0.6, y: 2.4, w: 8, h: 0.5,
    fontFace: "Georgia", italic: true, fontSize: 20, color: C.ink,
  });
  s.addText(
    "Journaling registra operações antes de executá-las, ajudando a recuperar o sistema após falhas. FAT16 e FAT32 não têm esse recurso.",
    { x: 0.6, y: 2.95, w: 6.2, h: 1.5, fontFace: "Calibri", fontSize: 14, color: C.body, lineSpacingMultiple: 1.3 }
  );

  // Implications card
  s.addShape(pptx.ShapeType.rect, {
    x: 7.2, y: 2.4, w: 5.5, h: 4,
    fill: { color: C.panel }, line: { color: C.line, width: 0.75 },
  });
  s.addText("Consequências", {
    x: 7.4, y: 2.55, w: 5.1, h: 0.4,
    fontFace: "Calibri", fontSize: 11, bold: true, color: C.muted, charSpacing: 4,
  });
  s.addText(
    [
      { text: "desligamento durante gravação → corrupção\n", options: { bullet: { code: "2022" } } },
      { text: "chkdsk tenta corrigir erros\n", options: { bullet: { code: "2022" } } },
      { text: "arquivos apagados são recuperáveis enquanto não sobrescritos\n", options: { bullet: { code: "2022" } } },
      { text: "cópia da FAT ajuda a mitigar danos", options: { bullet: { code: "2022" } } },
    ],
    { x: 7.5, y: 3.05, w: 5, h: 3.2, fontFace: "Calibri", fontSize: 13, color: C.ink, paraSpaceAfter: 6 }
  );

  s.addNotes(
    "A recuperação no FAT é limitada. " +
    "Existe uma cópia da tabela e o chkdsk pode corrigir erros, mas o sistema não é tão seguro quanto os que têm journaling."
  );
}

// ---------- Slide 9 — Comparação ----------
{
  const s = pptx.addSlide();
  pageFrame(s, { pageNum: 9 });
  addTitle(s, "Lado a lado", "Comparação direta");

  const rows = [
    ["Característica", "FAT16", "FAT32"],
    ["Época", "Mais antigo", "Mais novo"],
    ["Tamanho da entrada", "16 bits", "32 bits (28 úteis)"],
    ["Partições", "Menores", "Maiores"],
    ["Compatibilidade", "Alta", "Muito alta"],
    ["Arquivos > 4 GB", "Não adequado", "Não suporta"],
    ["Journaling", "Não", "Não"],
    ["Uso comum", "DOS, Windows antigos", "Pen drives, SD, simples"],
  ];

  const tableData = rows.map((r, i) =>
    r.map((cell, j) => ({
      text: cell,
      options: {
        bold: i === 0 || j === 0,
        fontFace: "Calibri",
        fontSize: i === 0 ? 13 : 12,
        color: i === 0 ? C.bg : (j === 0 ? C.ink : C.body),
        fill: { color: i === 0 ? C.ink : (i % 2 === 0 ? C.panel : C.bg) },
        align: j === 0 ? "left" : "center",
        valign: "middle",
      },
    }))
  );

  s.addTable(tableData, {
    x: 0.6, y: 2.4, w: 12.1,
    colW: [4.1, 4.0, 4.0],
    rowH: 0.45,
    border: { type: "solid", pt: 0.5, color: C.line },
    fontFace: "Calibri",
  });

  s.addNotes(
    "Quadro lado a lado: FAT32 evolui em entrada, partições e compatibilidade. " +
    "Ambos sem journaling. FAT32 não suporta arquivos maiores que 4 GB."
  );
}

// ---------- Slide 10 — Conclusão ----------
{
  const s = pptx.addSlide();
  pageFrame(s, { pageNum: 10 });
  addTitle(s, "Encerramento", "Conclusão");

  s.addText(
    "FAT16 e FAT32 são sistemas simples, antigos e muito compatíveis.",
    { x: 0.6, y: 2.5, w: 12, h: 0.7, fontFace: "Calibri", fontSize: 18, color: C.ink }
  );

  const blocks = [
    ["FAT16", "Importante em PCs antigos e mídias pequenas. Ficou limitado com o crescimento dos discos."],
    ["FAT32", "Evolução: partições maiores. Muito usado em dispositivos removíveis."],
    ["Limites", "Sem permissões avançadas, sem journaling, sem suporte a arquivos muito grandes."],
  ];
  const cw = 3.95, ch = 2.5, gap = 0.2, gx = 0.6, gy = 3.5;
  blocks.forEach((b, i) => {
    const x = gx + i * (cw + gap);
    s.addShape(pptx.ShapeType.rect, { x, y: gy, w: cw, h: ch, fill: { color: C.panel }, line: { color: C.line, width: 0.75 } });
    s.addShape(pptx.ShapeType.rect, { x, y: gy, w: cw, h: 0.06, fill: { color: C.ink }, line: { color: C.ink } });
    s.addText(b[0], {
      x: x + 0.25, y: gy + 0.3, w: cw - 0.5, h: 0.5,
      fontFace: "Georgia", fontSize: 20, bold: true, color: C.ink,
    });
    s.addText(b[1], {
      x: x + 0.25, y: gy + 0.95, w: cw - 0.5, h: ch - 1.1,
      fontFace: "Calibri", fontSize: 13, color: C.body, lineSpacingMultiple: 1.3,
    });
  });

  s.addText("Obrigado!", {
    x: 0.6, y: 6.3, w: 12, h: 0.5,
    fontFace: "Georgia", italic: true, fontSize: 18, color: C.muted, align: "right",
  });

  s.addNotes(
    "Concluindo: FAT16 e FAT32 são simples e muito compatíveis. " +
    "FAT16 marcou os PCs antigos; FAT32 evoluiu para suportar partições maiores e dominou os dispositivos removíveis. " +
    "Ambos carecem de permissões avançadas, journaling e suporte a arquivos muito grandes."
  );
}

await pptx.writeFile({ fileName: OUT });
console.log("OK ->", OUT);
