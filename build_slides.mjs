import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pptxgenPath =
  "C:/Users/faisc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/pptxgenjs@4.0.1/node_modules/pptxgenjs/dist/pptxgen.cjs.js";
const require = createRequire(import.meta.url);
const pptxgen = require(pptxgenPath);

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Projeto Sistemas Operacionais";
pptx.subject = "FAT16 e FAT32";
pptx.title = "Sistema de Arquivos FAT16 e FAT32";
pptx.company = "Turma 60";
pptx.lang = "pt-BR";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "pt-BR",
};

const OUT = path.join(__dirname, "Apresentacao_FAT16_FAT32.pptx");

const C = {
  ink: "111827",
  muted: "64748B",
  paper: "F8FAFC",
  panel: "FFFFFF",
  line: "CBD5E1",
  blue: "2563EB",
  blueSoft: "DBEAFE",
  green: "16A34A",
  greenSoft: "DCFCE7",
  orange: "F97316",
  orangeSoft: "FFEDD5",
  red: "DC2626",
  redSoft: "FEE2E2",
  cyan: "0891B2",
  cyanSoft: "CFFAFE",
};

function slideBase(kicker, title, subtitle) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.18,
    fill: { color: C.orange },
    line: { color: C.orange },
  });
  slide.addText(kicker.toUpperCase(), {
    x: 0.55,
    y: 0.42,
    w: 2.4,
    h: 0.24,
    fontFace: "Aptos",
    fontSize: 9,
    bold: true,
    color: C.orange,
    margin: 0,
    charSpace: 1.2,
  });
  slide.addText(title, {
    x: 0.55,
    y: 0.68,
    w: 8.8,
    h: 0.55,
    fontFace: "Aptos Display",
    fontSize: 26,
    bold: true,
    color: C.ink,
    margin: 0,
    breakLine: false,
    fit: "shrink",
  });
  slide.addText(subtitle, {
    x: 0.55,
    y: 1.22,
    w: 10.6,
    h: 0.34,
    fontSize: 13,
    color: C.muted,
    margin: 0,
    fit: "shrink",
  });
  return slide;
}

function footer(slide, num, note) {
  slide.addShape(pptx.ShapeType.line, {
    x: 0.55,
    y: 7.05,
    w: 11.3,
    h: 0,
    line: { color: C.line, width: 1 },
  });
  slide.addText(note, {
    x: 0.55,
    y: 7.12,
    w: 10.5,
    h: 0.22,
    fontSize: 8.5,
    color: C.muted,
    margin: 0,
    fit: "shrink",
  });
  slide.addText(String(num).padStart(2, "0"), {
    x: 12.2,
    y: 7.05,
    w: 0.55,
    h: 0.26,
    fontSize: 9,
    bold: true,
    color: "FFFFFF",
    align: "center",
    valign: "mid",
    margin: 0,
    fill: { color: C.orange },
  });
}

function box(slide, text, x, y, w, h, fill, line = C.line, opts = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.06,
    fill: { color: fill },
    line: { color: line, width: 1.2 },
  });
  slide.addText(text, {
    x: x + 0.08,
    y: y + 0.08,
    w: w - 0.16,
    h: h - 0.16,
    fontSize: opts.size || 13,
    bold: !!opts.bold,
    color: opts.color || C.ink,
    align: opts.align || "center",
    valign: "mid",
    margin: 0.04,
    fit: "shrink",
    breakLine: false,
  });
}

function arrow(slide, x1, y1, x2, y2, color = C.muted) {
  slide.addShape(pptx.ShapeType.line, {
    x: x1,
    y: y1,
    w: x2 - x1,
    h: y2 - y1,
    line: { color, width: 1.4, endArrowType: "triangle" },
  });
}

function bullets(slide, items, x, y, w, h, color = C.ink) {
  slide.addText(
    items.map((item) => ({ text: item, options: { bullet: { indent: 12 }, hanging: 4 } })),
    {
      x,
      y,
      w,
      h,
      fontSize: 15,
      color,
      margin: 0,
      breakLine: false,
      fit: "shrink",
      paraSpaceAfterPt: 8,
    },
  );
}

function table(slide, rows, x, y, w, h) {
  const colW = w / rows[0].length;
  const rowH = h / rows.length;
  rows.forEach((row, r) => {
    row.forEach((cell, c) => {
      const fill = r === 0 ? C.ink : c === 0 ? C.orangeSoft : C.panel;
      const color = r === 0 ? "FFFFFF" : C.ink;
      box(slide, cell, x + c * colW, y + r * rowH, colW, rowH, fill, C.line, {
        size: r === 0 ? 11 : 10.5,
        bold: r === 0 || c === 0,
        color,
      });
    });
  });
}

{
  const s = slideBase(
    "Visao geral",
    "Sistema de Arquivos FAT16 e FAT32",
    "Mini sistema de arquivos com tabela FAT, clusters e operacoes basicas",
  );
  box(s, "Disco", 0.75, 2.25, 1.55, 0.72, C.ink, C.ink, { color: "FFFFFF", bold: true });
  box(s, "Clusters", 3.0, 2.25, 1.55, 0.72, C.blueSoft, C.blue, { bold: true });
  box(s, "Tabela FAT", 5.25, 2.25, 1.75, 0.72, C.orangeSoft, C.orange, { bold: true });
  box(s, "Diretorios", 7.7, 2.25, 1.75, 0.72, C.cyanSoft, C.cyan, { bold: true });
  box(s, "Arquivos", 10.15, 2.25, 1.75, 0.72, C.greenSoft, C.green, { bold: true });
  arrow(s, 2.3, 2.61, 3.0, 2.61);
  arrow(s, 4.55, 2.61, 5.25, 2.61);
  arrow(s, 7.0, 2.61, 7.7, 2.61);
  arrow(s, 9.45, 2.61, 10.15, 2.61);
  bullets(
    s,
    [
      "FAT significa File Allocation Table.",
      "O arquivo e dividido em clusters.",
      "A tabela FAT encadeia os clusters de cada arquivo.",
      "A implementacao do projeto simula esse comportamento em JSON.",
    ],
    1.25,
    3.75,
    10.8,
    1.9,
  );
  footer(s, 1, "Objetivo: explicar FAT16/FAT32 e demonstrar o mini sistema funcionando.");
}

{
  const s = slideBase("Requisitos", "O que o trabalho pede", "Dois entregaveis: apresentacao e implementacao");
  box(s, "Apresentacao", 1.0, 2.0, 3.1, 0.7, C.blueSoft, C.blue, { bold: true });
  box(s, "Implementacao", 8.95, 2.0, 3.1, 0.7, C.greenSoft, C.green, { bold: true });
  bullets(s, ["Contexto historico", "Gerenciamento de arquivos", "Diretorios e alocacao", "Recuperacao de dados"], 1.1, 3.0, 4.6, 2.2);
  bullets(s, ["Ler e escrever", "Sobrescrever e substituir", "Apagar e renomear", "Mover arquivos e pastas"], 7.45, 3.0, 4.6, 2.2);
  arrow(s, 4.4, 2.35, 8.55, 2.35, C.orange);
  box(s, "O projeto entrega teoria + demonstracao manual pelo manual.bat", 3.9, 5.8, 5.65, 0.65, C.orangeSoft, C.orange, {
    bold: true,
    size: 12,
  });
  footer(s, 2, "Baseado no PDF do projeto de Sistemas Operacionais.");
}

{
  const s = slideBase("Mecanismo", "Como a FAT organiza arquivos", "O diretorio guarda o primeiro cluster; a FAT guarda a sequencia");
  box(s, "Entrada no diretorio\n/aula.txt\ninicio = 3", 0.85, 2.15, 2.1, 1.15, C.cyanSoft, C.cyan, { bold: true, size: 12 });
  box(s, "Cluster 3\nabcd", 3.65, 2.3, 1.5, 0.9, C.blueSoft, C.blue, { bold: true });
  box(s, "Cluster 4\nefgh", 5.85, 2.3, 1.5, 0.9, C.blueSoft, C.blue, { bold: true });
  box(s, "Cluster 5\ni", 8.05, 2.3, 1.5, 0.9, C.blueSoft, C.blue, { bold: true });
  box(s, "Fim", 10.25, 2.3, 1.3, 0.9, C.greenSoft, C.green, { bold: true });
  arrow(s, 2.95, 2.73, 3.65, 2.73);
  arrow(s, 5.15, 2.73, 5.85, 2.73);
  arrow(s, 7.35, 2.73, 8.05, 2.73);
  arrow(s, 9.55, 2.73, 10.25, 2.73);
  table(
    s,
    [
      ["Indice", "Valor na FAT"],
      ["FAT[3]", "4"],
      ["FAT[4]", "5"],
      ["FAT[5]", "fim"],
    ],
    4.15,
    4.15,
    4.9,
    1.45,
  );
  footer(s, 3, "Para ler o arquivo, o sistema segue a cadeia ate encontrar o marcador de fim.");
}

{
  const s = slideBase("Clusters", "Clusters sao blocos fixos do disco", "Eles sao a menor unidade de alocacao do sistema de arquivos");
  box(s, "Texto salvo:\nabcdefghi", 1.1, 2.15, 2.25, 0.9, C.panel, C.line, { bold: true });
  box(s, "Cluster size\n4 bytes", 4.25, 2.15, 1.8, 0.9, C.orangeSoft, C.orange, { bold: true });
  arrow(s, 3.35, 2.6, 4.25, 2.6, C.orange);
  box(s, "Cluster 3\nabcd", 2.15, 4.0, 1.7, 0.9, C.blueSoft, C.blue, { bold: true });
  box(s, "Cluster 4\nefgh", 4.35, 4.0, 1.7, 0.9, C.blueSoft, C.blue, { bold: true });
  box(s, "Cluster 5\ni", 6.55, 4.0, 1.7, 0.9, C.blueSoft, C.blue, { bold: true });
  box(s, "Sobra dentro do cluster\npode ser desperdicio", 8.85, 3.9, 2.55, 1.1, C.redSoft, C.red, { bold: true, size: 12 });
  footer(s, 4, "Se um arquivo e menor que um cluster, mesmo assim ocupa um cluster inteiro.");
}

{
  const s = slideBase("FAT16", "FAT16 e simples, compativel e limitado", "Usa entradas de 16 bits para enderecar clusters");
  bullets(
    s,
    [
      "Ate 65.524 clusters uteis.",
      "Muito usado em DOS, Windows antigos e midias pequenas.",
      "Diretorio raiz tradicionalmente fica em uma area fixa.",
      "Nao possui journaling.",
      "Recuperacao depende de verificacao da FAT e reparo de cadeias.",
    ],
    0.9,
    2.05,
    6.0,
    3.7,
  );
  box(s, "No simulador\nFAT16 limita clusters\ne trata a raiz como fixa", 7.55, 2.3, 3.65, 1.45, C.blueSoft, C.blue, {
    bold: true,
    size: 15,
  });
  box(s, "Ponto forte:\nsimplicidade", 7.55, 4.25, 1.7, 0.9, C.greenSoft, C.green, { bold: true });
  box(s, "Ponto fraco:\ncapacidade", 9.5, 4.25, 1.7, 0.9, C.redSoft, C.red, { bold: true });
  footer(s, 5, "FAT16 e facil de entender, mas nao foi projetado para volumes muito grandes.");
}

{
  const s = slideBase("FAT32", "FAT32 amplia a capacidade da familia FAT", "Usa entradas de 32 bits, normalmente com 28 bits uteis");
  bullets(
    s,
    [
      "Permite muito mais clusters que FAT16.",
      "Diretorio raiz fica na area de dados, como outros diretorios.",
      "Alta compatibilidade entre Windows, Linux, macOS e dispositivos.",
      "Nao possui journaling.",
      "Tamanho maximo comum por arquivo: 4 GiB menos 1 byte.",
    ],
    0.9,
    2.05,
    6.4,
    3.7,
  );
  box(s, "No simulador\nraiz do FAT32 fica\nno cluster 2", 7.75, 2.15, 3.35, 1.25, C.greenSoft, C.green, {
    bold: true,
    size: 15,
  });
  box(s, "Uso comum\npendrives, cartoes,\ncameras e consoles", 7.75, 4.05, 3.35, 1.25, C.cyanSoft, C.cyan, {
    bold: true,
    size: 14,
  });
  footer(s, 6, "FAT32 continua popular por compatibilidade, apesar das limitacoes.");
}

{
  const s = slideBase("Comparacao", "FAT16 x FAT32", "A diferenca principal esta no enderecamento e no diretorio raiz");
  table(
    s,
    [
      ["Caracteristica", "FAT16", "FAT32"],
      ["Entrada FAT", "16 bits", "32 bits, 28 uteis"],
      ["Capacidade", "Menor", "Maior"],
      ["Raiz", "Area fixa", "Cluster comum"],
      ["Journaling", "Nao", "Nao"],
      ["Uso comum", "Legado/midias pequenas", "Pendrives/cartoes"],
    ],
    0.9,
    2.05,
    11.45,
    3.55,
  );
  footer(s, 7, "Ambos usam a mesma ideia central: tabela FAT encadeando clusters.");
}

{
  const s = slideBase("Implementacao", "Como o mini sistema foi construido", "A imagem JSON simula um volume de disco FAT");
  box(s, "Imagem JSON", 0.8, 2.55, 1.8, 0.85, C.ink, C.ink, { color: "FFFFFF", bold: true });
  box(s, "Metadados\ntipo, tamanho,\nclusters", 3.4, 1.9, 2.1, 1.15, C.panel, C.line, { bold: true, size: 12 });
  box(s, "Tabela FAT\nlivre, proximo,\nfim", 3.4, 4.0, 2.1, 1.15, C.orangeSoft, C.orange, { bold: true, size: 12 });
  box(s, "Diretorios\nnome, tipo,\ninicio", 6.35, 1.9, 2.1, 1.15, C.cyanSoft, C.cyan, { bold: true, size: 12 });
  box(s, "Area de dados\nconteudo em\nclusters", 6.35, 4.0, 2.1, 1.15, C.greenSoft, C.green, { bold: true, size: 12 });
  box(s, "Operacoes\nmenu manual\n+ CLI", 9.3, 2.95, 2.1, 1.15, C.blueSoft, C.blue, { bold: true, size: 12 });
  arrow(s, 2.6, 2.98, 3.4, 2.48);
  arrow(s, 2.6, 2.98, 3.4, 4.55);
  arrow(s, 5.5, 2.48, 6.35, 2.48);
  arrow(s, 5.5, 4.55, 6.35, 4.55);
  arrow(s, 8.45, 2.48, 9.3, 3.35);
  arrow(s, 8.45, 4.55, 9.3, 3.55);
  footer(s, 8, "O projeto nao monta uma particao real; ele demonstra o mecanismo principal da FAT.");
}

{
  const s = slideBase("Operacoes", "O que acontece em cada acao", "As operacoes alteram entradas de diretorio, dados e tabela FAT");
  box(s, "Criar arquivo", 0.9, 2.0, 2.1, 0.65, C.blueSoft, C.blue, { bold: true });
  box(s, "Aloca clusters", 0.9, 2.9, 2.1, 0.65, C.panel, C.line);
  box(s, "Atualiza FAT", 0.9, 3.8, 2.1, 0.65, C.orangeSoft, C.orange);
  box(s, "Cria entrada", 0.9, 4.7, 2.1, 0.65, C.panel, C.line);
  arrow(s, 1.95, 2.65, 1.95, 2.9);
  arrow(s, 1.95, 3.55, 1.95, 3.8);
  arrow(s, 1.95, 4.45, 1.95, 4.7);
  box(s, "Ler arquivo", 4.2, 2.0, 2.1, 0.65, C.greenSoft, C.green, { bold: true });
  box(s, "Acha entrada", 4.2, 2.9, 2.1, 0.65, C.panel, C.line);
  box(s, "Segue cadeia FAT", 4.2, 3.8, 2.1, 0.65, C.orangeSoft, C.orange);
  arrow(s, 5.25, 2.65, 5.25, 2.9);
  arrow(s, 5.25, 3.55, 5.25, 3.8);
  box(s, "Apagar arquivo", 7.5, 2.0, 2.1, 0.65, C.redSoft, C.red, { bold: true });
  box(s, "Remove entrada", 7.5, 2.9, 2.1, 0.65, C.panel, C.line);
  box(s, "Libera clusters", 7.5, 3.8, 2.1, 0.65, C.orangeSoft, C.orange);
  arrow(s, 8.55, 2.65, 8.55, 2.9);
  arrow(s, 8.55, 3.55, 8.55, 3.8);
  box(s, "Mover/Renomear\naltera diretorio", 10.45, 2.9, 1.75, 1.55, C.cyanSoft, C.cyan, { bold: true, size: 12 });
  footer(s, 9, "A demonstracao manual mostra essas operacoes acontecendo no menu.");
}

{
  const s = slideBase("Demonstracao", "Roteiro para apresentar ao vivo", "Use manual.bat e execute as operacoes pelo menu");
  const steps = [
    "Abrir manual.bat",
    "Criar FAT16: 12 clusters, 4 bytes",
    "Criar /docs",
    "Criar /docs/aula.txt",
    "Ler arquivo",
    "Mostrar tabela FAT",
    "Adicionar/substituir texto",
    "Renomear e mover",
    "Mostrar arvore",
    "Apagar arquivo",
  ];
  steps.forEach((step, i) => {
    const x = i < 5 ? 0.85 : 6.65;
    const y = 1.95 + (i % 5) * 0.8;
    box(s, `${i + 1}. ${step}`, x, y, 5.35, 0.55, i === 5 ? C.orangeSoft : C.panel, i === 5 ? C.orange : C.line, {
      size: 12,
      bold: i === 0 || i === 5,
      align: "left",
    });
  });
  box(s, "Frase para explicar:\n\"O menu facilita a demonstracao, mas cada opcao chama uma operacao real do mini sistema FAT.\"", 1.45, 6.15, 10.35, 0.7, C.greenSoft, C.green, { bold: true, size: 12 });
  footer(s, 10, "Mostre a tabela FAT antes/depois para provar a alocacao por clusters.");
}

await pptx.writeFile({ fileName: OUT });
console.log(JSON.stringify({ finalPptx: OUT, slideCount: pptx._slides.length }, null, 2));
