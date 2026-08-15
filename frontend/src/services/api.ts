import axios from "axios";
import type {
  ChunkingConfigInput,
  ChunkingConfigResponse,
  ChunkingJob,
} from "../pages/Knowledge/chunking";

const API_BASE = new URL("api/", window.location.origin + import.meta.env.BASE_URL).toString();

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ---- Knowledge ----
export const knowledgeApi = {
  listDocuments: (params?: Record<string, string>) => api.get("/knowledge/documents", { params }),
  getDocument: (id: number) => api.get(`/knowledge/documents/${id}`),
  getSample: () => api.get("/knowledge/documents/sample"),
  getStats: () => api.get("/knowledge/stats"),
  getChunkingConfig: (documentId: number) =>
    api.get<ChunkingConfigResponse>(`/knowledge/documents/${documentId}/chunking`),
  updateChunkingConfig: (documentId: number, data: ChunkingConfigInput) =>
    api.put<ChunkingJob>(`/knowledge/documents/${documentId}/chunking`, data),
  getChunkingJob: (jobId: number) =>
    api.get<ChunkingJob>(`/knowledge/chunking-jobs/${jobId}`),
};

// ---- Studio / Pipeline ----
export const studioApi = {
  runCase: (data: { query: string; configId: string }) => api.post("/studio/cases", data),
  getStages: (caseId: string) => api.get(`/studio/cases/${caseId}/stages`),
};

// ---- Traces ----
export const tracesApi = {
  list: (params?: Record<string, string>) => api.get("/traces", { params }),
  getById: (id: string) => api.get(`/traces/${id}`),
};

// ---- Prompt ----
export const promptApi = {
  listVersions: (component?: string) => api.get("/prompts/versions", { params: { component } }),
  getComponents: (component: string) => api.get(`/prompts/components/${component}`),
  updateComponent: (id: number, data: unknown) => api.put(`/prompts/components/${id}`, data),
};

// ---- Memory ----
export const memoryApi = {
  listRules: () => api.get("/memory/rules"),
  getStats: () => api.get("/memory/stats"),
};

// ---- Evaluations ----
export const evaluationsApi = {
  create: (data: unknown) => api.post("/evaluations", data),
  getReport: (id: string) => api.get(`/evaluations/${id}/report`),
};

export default api;
