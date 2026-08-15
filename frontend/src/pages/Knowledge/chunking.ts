export type ChunkingStrategy = "STRUCTURE" | "FIXED_LENGTH" | "RECURSIVE" | "SEMANTIC";

export type ChunkingConfigInput = {
  strategy: ChunkingStrategy;
  chunkSize: number;
  overlap: number;
  minChunkSize: number;
  maxChunkSize: number;
  preserveHeadings: boolean;
  preserveTables: boolean;
  parentChildEnabled: boolean;
  parentChunkSize: number;
  tokenizer: string;
  separators: string;
};

export type ChunkingJob = {
  id: number;
  documentId: number;
  configVersionId: number;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  stage: string;
  progress: number;
  message: string;
  errorMessage?: string | null;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
};

export type ChunkingConfigResponse = ChunkingConfigInput & {
  id: number | null;
  documentId: number;
  versionNumber: number;
  status: "DRAFT" | "BUILDING" | "ACTIVE" | "FAILED" | "SUPERSEDED";
  createdAt?: string;
  activatedAt?: string | null;
  latestJob?: ChunkingJob | null;
};

export const DEFAULT_CHUNKING_CONFIG: ChunkingConfigInput = {
  strategy: "STRUCTURE",
  chunkSize: 512,
  overlap: 80,
  minChunkSize: 120,
  maxChunkSize: 800,
  preserveHeadings: true,
  preserveTables: true,
  parentChildEnabled: true,
  parentChunkSize: 1200,
  tokenizer: "cl100k_base",
  separators: "\\n## |\\n### |\\n\\n|\\n|。",
};

export const CHUNKING_STRATEGIES: Array<{
  value: ChunkingStrategy;
  label: string;
  description: string;
}> = [
  { value: "STRUCTURE", label: "段落 / 标题层级", description: "优先保留文档结构" },
  { value: "FIXED_LENGTH", label: "固定长度", description: "按 Token 数等距切分" },
  { value: "RECURSIVE", label: "递归切分", description: "按分隔符逐级降级" },
  { value: "SEMANTIC", label: "语义分块", description: "按语义相似度寻找断点" },
];

export const CHUNKING_PROGRESS_STAGES = [
  { id: "VALIDATING", label: "校验配置", threshold: 12 },
  { id: "CHUNKING", label: "重新分块", threshold: 42 },
  { id: "WRITING_DATABASE", label: "写入数据库", threshold: 72 },
  { id: "PREPARING_INDEX", label: "准备索引", threshold: 90 },
  { id: "COMPLETED", label: "切换版本", threshold: 100 },
];

export function validateChunkingConfig(config: ChunkingConfigInput) {
  const errors: string[] = [];

  if (config.chunkSize < 64) {
    errors.push("Chunk 长度不能小于 64");
  }
  if (config.overlap < 0 || config.overlap >= config.chunkSize) {
    errors.push("Overlap 必须小于 Chunk 长度");
  }
  if (config.minChunkSize < 1 || config.minChunkSize > config.maxChunkSize) {
    errors.push("最小长度不能大于最大长度");
  }
  if (config.maxChunkSize < config.chunkSize) {
    errors.push("最大长度不能小于 Chunk 长度");
  }
  if (config.parentChunkSize < config.maxChunkSize) {
    errors.push("Parent Chunk 长度不能小于最大长度");
  }

  return errors;
}

export function isChunkingJobActive(job?: ChunkingJob | null) {
  return job?.status === "QUEUED" || job?.status === "RUNNING";
}
