# Mini Sistema de Arquivos FAT16/FAT32

Este projeto atende ao PDF `Trabalho Sistemas de Arquivo Turma 60.pdf`.
O trabalho pede dois entregaveis:

1. Uma apresentacao explicando o sistema de arquivos sorteado.
2. Uma implementacao de um mini sistema de arquivos com operacoes basicas:
   ler, escrever, sobrescrever, apagar, substituir, renomear e mover.

## Como executar

Use Python 3:

Para apresentar fazendo as operacoes manualmente:

```powershell
.\manual.bat
```

Esse modo abre um menu numerado para criar pasta, escrever arquivo, ler,
sobrescrever, substituir texto, renomear, mover, apagar e ver a tabela FAT.

Roteiro manual sugerido para a apresentacao:

1. Abra `manual.bat`.
2. Crie uma imagem FAT16.
3. Use a opcao `2` para criar a pasta `/docs`.
4. Use a opcao `3` para criar `/docs/aula.txt` com o texto `abcdefghi`.
5. Use a opcao `4` para ler `/docs/aula.txt`.
6. Use a opcao `13` para mostrar a tabela FAT.
7. Use a opcao `6` para adicionar texto no final do arquivo.
8. Use a opcao `7` para substituir um trecho do arquivo.
9. Use a opcao `8` para renomear `aula.txt` para `arquivo.txt`.
10. Use a opcao `9` para mover `/docs/arquivo.txt` para `/arquivo.txt`.
11. Use a opcao `12` para mostrar a arvore.
12. Use a opcao `10` para apagar `/arquivo.txt`.

Modo mais simples:

```powershell
.\testar.bat
```

Esse modo roda uma demonstracao automatica, apenas para conferir que esta tudo
funcionando.

Ou rode a demo pelo Python:

```powershell
python .\mini_fat.py demo
```

Modo manual:

```powershell
python .\mini_fat.py format fat16.json --type FAT16 --clusters 128 --cluster-size 32
python .\mini_fat.py mkdir fat16.json /docs
python .\mini_fat.py write fat16.json /docs/nota.txt "ola mundo"
python .\mini_fat.py read fat16.json /docs/nota.txt
python .\mini_fat.py append fat16.json /docs/nota.txt " atualizado"
python .\mini_fat.py replace fat16.json /docs/nota.txt mundo FAT
python .\mini_fat.py overwrite fat16.json /docs/nota.txt "novo conteudo"
python .\mini_fat.py rename fat16.json /docs/nota.txt aula.txt
python .\mini_fat.py move fat16.json /docs/aula.txt /aula.txt
python .\mini_fat.py ls fat16.json /
python .\mini_fat.py fat fat16.json --limit 20
python .\mini_fat.py rm fat16.json /aula.txt
```

Para testar FAT32, basta formatar outra imagem:

```powershell
python .\mini_fat.py format fat32.json --type FAT32 --clusters 128 --cluster-size 32
```

## O que foi implementado

O arquivo `mini_fat.py` cria uma imagem de disco em JSON. A imagem guarda:

- metadados do volume, como tipo FAT16/FAT32 e tamanho do cluster;
- tabela FAT, onde cada posicao representa um cluster;
- area de dados, com o conteudo dos arquivos dividido por clusters;
- diretorios, com entradas de arquivos e subdiretorios.

Operacoes disponiveis:

- `format`: cria uma imagem FAT16 ou FAT32;
- `mkdir`: cria diretorios;
- `write`: escreve um novo arquivo;
- `read`: le um arquivo;
- `overwrite`: sobrescreve o conteudo inteiro de um arquivo;
- `append`: adiciona conteudo ao final;
- `replace`: substitui trechos dentro do arquivo;
- `rm`: apaga arquivos ou diretorios;
- `rename`: renomeia uma entrada;
- `move`: move arquivos ou diretorios;
- `ls`, `tree`, `info` e `fat`: mostram a estrutura do volume.

## Como a FAT funciona

FAT significa File Allocation Table. A ideia central e simples: o disco e dividido em
clusters, e a tabela FAT informa como esses clusters estao ligados.

Exemplo: se um arquivo usa os clusters 5, 9 e 10, a tabela pode guardar:

```text
FAT[5]  = 9
FAT[9]  = 10
FAT[10] = fim do arquivo
```

Assim, a entrada do diretorio precisa guardar apenas o primeiro cluster do arquivo.
Para ler o arquivo, o sistema operacional segue a cadeia na FAT ate encontrar o
marcador de fim.

## FAT16

FAT16 usa entradas de 16 bits na tabela FAT. Isso limita a quantidade de clusters
enderecaveis, entao volumes FAT16 costumam ser menores que volumes FAT32.

Caracteristicas importantes:

- muito usado em DOS, Windows antigos, cartoes e midias removiveis pequenas;
- estrutura simples e facil de implementar;
- diretorio raiz tradicionalmente fica em uma area fixa do volume;
- nao tem journaling, entao queda de energia pode deixar arquivos ou cadeias FAT
  inconsistentes;
- nomes antigos seguem o padrao 8.3, embora extensoes posteriores tenham criado
  suporte a nomes longos.

No simulador, o modo FAT16 tem limite de clusters e trata o diretorio raiz como uma
estrutura fixa com limite de entradas.

## FAT32

FAT32 evolui a ideia da FAT usando entradas de 32 bits, embora normalmente 28 bits
sejam usados para o numero do cluster. Isso permite volumes bem maiores e reduz o
desperdicio causado por clusters muito grandes.

Caracteristicas importantes:

- usado em Windows, Linux, macOS, cameras, pendrives, consoles e dispositivos
  embarcados;
- bom para compatibilidade entre sistemas operacionais;
- diretorio raiz fica na area de dados, como os demais diretorios;
- possui estrutura FSInfo em implementacoes reais para ajudar a localizar espaco
  livre;
- nao possui journaling;
- tamanho maximo de arquivo geralmente e 4 GiB menos 1 byte.

No simulador, o modo FAT32 aloca o diretorio raiz em um cluster normal da area de
dados, aproximando o comportamento real.

## Comparacao rapida

| Caracteristica | FAT16 | FAT32 |
| --- | --- | --- |
| Tamanho da entrada FAT | 16 bits | 32 bits, com 28 bits uteis |
| Capacidade | Menor | Maior |
| Diretorio raiz | Area fixa | Cluster comum na area de dados |
| Compatibilidade | Muito alta | Muito alta |
| Journaling | Nao | Nao |
| Uso comum | Midias pequenas/legado | Pendrives, cartoes e dispositivos |

## Pontos para a apresentacao

1. Contexto historico: FAT foi criada para ser simples e rapida em discos pequenos.
2. Estrutura do volume: setor de boot, tabelas FAT, diretorio raiz e area de dados.
3. Alocacao: arquivos usam cadeias de clusters ligadas pela tabela FAT.
4. Diretorios: cada entrada guarda nome, atributos, tamanho e primeiro cluster.
5. Operacoes: criar, ler, sobrescrever, remover, renomear e mover alteram entradas
   de diretorio e/ou a tabela FAT.
6. Recuperacao: sem journaling, a recuperacao depende de verificacao da FAT,
   deteccao de cadeias perdidas e reparo de entradas inconsistentes.
7. Comparacao FAT16 x FAT32: limite de clusters, tratamento da raiz e capacidade.
8. Demonstracao: executar comandos no `mini_fat.py` mostrando a FAT antes e depois
   de criar, mover e apagar arquivos.

## Limitacoes didaticas

Este projeto e uma simulacao. Ele nao monta volumes reais no sistema operacional,
nao implementa setor de boot binario, permissao de usuario, datas no formato exato
da FAT, atributos completos, nomes longos no formato LFN real nem recuperacao
automatica apos falhas. O objetivo e demonstrar corretamente o mecanismo principal:
diretorios apontam para o primeiro cluster, e a FAT encadeia os clusters do arquivo.
