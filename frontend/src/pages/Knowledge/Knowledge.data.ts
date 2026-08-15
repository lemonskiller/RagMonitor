export type KnowledgeDocument = {
  id: number;
  name: string;
  source: string;
  parser: string;
  chunks: number;
  duplicateStatus: string;
  ingestStatus: string;
  updatedAt: string;
  previewStatus: "available" | "not-mounted";
  previewUrl?: string;
  sourceDatabase?: string;
  title?: string;
  description?: string;
  category?: string;
  defaultEntityType?: string;
  evidenceClass?: string;
  homepage?: string;
  license?: string;
  snapshotRelease?: string;
  parserVersion?: string;
  recordCount?: number;
  sourceFileCount?: number;
  sampleRecords?: KnowledgeSampleRecord[];
};

export type KnowledgeSampleRecord = {
  record_id: string;
  source_database: string;
  source_file: string;
  source_row: number | null;
  entity_type: string | null;
  primary_name: string | null;
  aliases: string | null;
  uniprot_id: string | null;
  gene_name: string | null;
  organism: string | null;
  condensate: string | null;
  llps_role: string | null;
  evidence_type: string | null;
  pmids: string | null;
  description: string | null;
  raw_json: string;
  condensate_tags: string;
  canonical_id: string;
  evidence_class: string;
  evidence_detail: string;
  schema_version: number;
};

export type ParsingBlock = {
  id: string;
  page: number;
  type: "heading" | "paragraph" | "caption" | "table";
  bbox: [number, number, number, number];
  confidence: number;
  rawText: string;
  cleanedText: string;
  changes: string[];
};

export type ChunkRecord = {
  id: string;
  page: number;
  parentId: string;
  position: string;
  tokens: number;
  overlap: number;
  heading: string;
  content: string;
  embeddingStatus: string;
};

export type MultimodalRecord = {
  id: string;
  page: number;
  type: "figure" | "table" | "equation";
  bbox: [number, number, number, number];
  confidence: number;
  title: string;
  caption: string;
  extractedContent: string;
};

export type KnowledgeDocumentDetails = {
  dataSource: "prototype";
  parsing: {
    runId: string;
    blocks: ParsingBlock[];
  };
  chunks: ChunkRecord[];
  multimodal: MultimodalRecord[];
};

export const DEFAULT_SAMPLE_SIZE = 10;

export function normalizeSampleSize(value: string | number) {
  const parsedValue = Math.floor(Number(value));

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : DEFAULT_SAMPLE_SIZE;
}

export function getSamplingProgress(completed: number, total: number) {
  if (total <= 0) return 0;

  return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
}

export const KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: 1,
    name: "LLPS_review_2025.pdf",
    source: "phase-prod/papers",
    parser: "PDF Layout v3",
    chunks: 684,
    duplicateStatus: "无重复",
    ingestStatus: "已入库",
    updatedAt: "12 分钟前",
    previewStatus: "not-mounted",
  },
  {
    id: 2,
    name: "PNAS-2016-E4321.pdf",
    source: "phase-prod/papers",
    parser: "PDF Layout v3",
    chunks: 72,
    duplicateStatus: "无重复",
    ingestStatus: "已入库",
    updatedAt: "2 小时前",
    previewStatus: "not-mounted",
  },
];

export function getKnowledgeDocument(name: string) {
  return KNOWLEDGE_DOCUMENTS.find((document) => document.name === name);
}

const KNOWLEDGE_DOCUMENT_DETAILS: Record<string, KnowledgeDocumentDetails> = {
  "LLPS_review_2025.pdf": {
    dataSource: "prototype",
    parsing: {
      runId: "parse-20250815-1042",
      blocks: [
        {
          id: "BLK-P012-04",
          page: 12,
          type: "paragraph",
          bbox: [72, 188, 523, 286],
          confidence: 0.982,
          rawText: "LLPS REVIEW 2025  |  12\nAt low salt concentra- tions, anion binding dominates the protein surface interaction.",
          cleanedText: "At low salt concentrations, anion binding dominates the protein surface interaction.",
          changes: ["移除重复页眉", "合并断行单词", "规范空白字符"],
        },
        {
          id: "BLK-P012-05",
          page: 12,
          type: "caption",
          bbox: [76, 452, 518, 511],
          confidence: 0.957,
          rawText: "Fig. 4 | Salt-dependent phase behaviour. Error bars indicate s.d.",
          cleanedText: "Figure 4. Salt-dependent phase behaviour. Error bars indicate standard deviation.",
          changes: ["展开缩写", "统一图注标点"],
        },
        {
          id: "BLK-P014-02",
          page: 14,
          type: "table",
          bbox: [84, 206, 516, 438],
          confidence: 0.934,
          rawText: "Condition  NaCl(mM)  Csat(uM)\nA 50 12.4\nB 150 28.1",
          cleanedText: "Condition | NaCl (mM) | Csat (uM)\nA | 50 | 12.4\nB | 150 | 28.1",
          changes: ["恢复表格列边界", "规范单位空格"],
        },
      ],
    },
    chunks: [
      {
        id: "CHUNK-0128",
        page: 12,
        parentId: "SEC-03",
        position: "128 / 684",
        tokens: 318,
        overlap: 80,
        heading: "Salt-dependent phase behaviour",
        content: "At low salt concentrations, anion binding dominates the protein surface interaction. Increasing ionic strength screens electrostatic interactions and shifts the saturation concentration.",
        embeddingStatus: "已写入 EB",
      },
      {
        id: "CHUNK-0129",
        page: 12,
        parentId: "SEC-03",
        position: "129 / 684",
        tokens: 286,
        overlap: 80,
        heading: "Salt-dependent phase behaviour",
        content: "The measured coexistence curves show a non-linear response to salt concentration, suggesting competition between charge screening and ion-specific binding.",
        embeddingStatus: "已写入 EB",
      },
      {
        id: "CHUNK-0130",
        page: 13,
        parentId: "SEC-03",
        position: "130 / 684",
        tokens: 341,
        overlap: 80,
        heading: "Sequence determinants",
        content: "Sequence patterning changes the balance between short-range attraction and long-range electrostatic repulsion, thereby modifying phase boundaries.",
        embeddingStatus: "已写入 EB",
      },
    ],
    multimodal: [
      {
        id: "FIG-P012-02",
        page: 12,
        type: "figure",
        bbox: [74, 302, 520, 448],
        confidence: 0.964,
        title: "Figure 4 · Salt-dependent phase behaviour",
        caption: "Coexistence curves measured across increasing NaCl concentrations.",
        extractedContent: "折线图；x 轴为 NaCl concentration (mM)，y 轴为 saturation concentration (uM)；三组实验条件均随盐浓度上升而增加。",
      },
      {
        id: "TABLE-P014-01",
        page: 14,
        type: "table",
        bbox: [84, 206, 516, 438],
        confidence: 0.934,
        title: "Table 2 · Phase boundary measurements",
        caption: "Saturation concentrations under two ionic conditions.",
        extractedContent: "Condition | NaCl (mM) | Csat (uM)\nA | 50 | 12.4\nB | 150 | 28.1",
      },
      {
        id: "EQUATION-P015-03",
        page: 15,
        type: "equation",
        bbox: [138, 348, 472, 397],
        confidence: 0.912,
        title: "Equation 3 · Free energy density",
        caption: "Mean-field free energy used for fitting the phase boundary.",
        extractedContent: "f(phi) = phi ln(phi) + (1 - phi) ln(1 - phi) + chi phi(1 - phi)",
      },
    ],
  },
  "PNAS-2016-E4321.pdf": {
    dataSource: "prototype",
    parsing: {
      runId: "parse-20250815-0920",
      blocks: [
        {
          id: "BLK-P003-08",
          page: 3,
          type: "paragraph",
          bbox: [78, 214, 526, 326],
          confidence: 0.976,
          rawText: "PNAS  |  E4323\nMultivalent interactions create a sharp transition between dispersed and condensed states.",
          cleanedText: "Multivalent interactions create a sharp transition between dispersed and condensed states.",
          changes: ["移除期刊页眉", "规范段落边界"],
        },
        {
          id: "BLK-P004-03",
          page: 4,
          type: "caption",
          bbox: [82, 466, 520, 526],
          confidence: 0.948,
          rawText: "Fig. 2. Concentration dependence of droplet formation.",
          cleanedText: "Figure 2. Concentration dependence of droplet formation.",
          changes: ["统一图注前缀"],
        },
      ],
    },
    chunks: [
      {
        id: "CHUNK-0021",
        page: 3,
        parentId: "SEC-02",
        position: "21 / 72",
        tokens: 302,
        overlap: 64,
        heading: "Multivalent interactions",
        content: "Multivalent interactions create a sharp transition between dispersed and condensed states over a narrow concentration range.",
        embeddingStatus: "已写入 EB",
      },
      {
        id: "CHUNK-0022",
        page: 4,
        parentId: "SEC-02",
        position: "22 / 72",
        tokens: 274,
        overlap: 64,
        heading: "Concentration dependence",
        content: "Droplet formation increases above the saturation threshold and remains reversible after dilution.",
        embeddingStatus: "已写入 EB",
      },
    ],
    multimodal: [
      {
        id: "FIG-P004-01",
        page: 4,
        type: "figure",
        bbox: [80, 282, 522, 458],
        confidence: 0.951,
        title: "Figure 2 · Droplet formation",
        caption: "Concentration dependence of droplet formation.",
        extractedContent: "显微图像组；随蛋白浓度增加，液滴数量和平均直径均增加。",
      },
      {
        id: "TABLE-P006-01",
        page: 6,
        type: "table",
        bbox: [92, 238, 508, 432],
        confidence: 0.927,
        title: "Table 1 · Experimental conditions",
        caption: "Buffers and concentrations used in phase-separation assays.",
        extractedContent: "Buffer | pH | Protein (uM)\nHEPES | 7.4 | 25\nTris | 8.0 | 40",
      },
    ],
  },
};

export function getKnowledgeDocumentDetails(name: string) {
  return KNOWLEDGE_DOCUMENT_DETAILS[name];
}

export function buildChunksFromSampleRecords(records: KnowledgeSampleRecord[], totalCount?: number): ChunkRecord[] {
  return records.map((record, index) => ({
    id: record.record_id,
    page: index + 1,
    parentId: record.source_database,
    position: `${index + 1} / ${totalCount ?? records.length}`,
    tokens: Math.max(64, Math.round((record.description?.length ?? 0) / 4)),
    overlap: 0,
    heading: record.primary_name || record.gene_name || record.entity_type || record.record_id,
    content: record.description || record.raw_json || "",
    embeddingStatus: record.evidence_class ? `SDB FTS5 / ${record.evidence_class}` : "SDB FTS5 indexed",
  }));
}
