import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ---- Knowledge ----
export const knowledgeApi = {
  listDocuments: (params?: Record<string, string>) => api.get("/knowledge/documents", { params }),
  getDocument: (id: number) => api.get(`/knowledge/documents/${id}`),
  getSample: () => api.get("/knowledge/documents/sample"),
  getStats: () => api.get("/knowledge/stats"),
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
