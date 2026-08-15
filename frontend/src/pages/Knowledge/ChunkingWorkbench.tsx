import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  CheckCircle2,
  CircleDashed,
  Database,
  RefreshCw,
  RotateCcw,
  Save,
  Split,
} from "lucide-react";
import { knowledgeApi } from "../../services/api";
import {
  CHUNKING_PROGRESS_STAGES,
  CHUNKING_STRATEGIES,
  DEFAULT_CHUNKING_CONFIG,
  isChunkingJobActive,
  validateChunkingConfig,
} from "./chunking";
import type {
  ChunkingConfigInput,
  ChunkingConfigResponse,
  ChunkingJob,
} from "./chunking";
import type { ChunkRecord, KnowledgeDocument } from "./Knowledge.data";

type ChunkingWorkbenchProps = {
  document: KnowledgeDocument;
  chunks: ChunkRecord[];
};

function toInput(config: ChunkingConfigResponse): ChunkingConfigInput {
  return {
    strategy: config.strategy,
    chunkSize: config.chunkSize,
    overlap: config.overlap,
    minChunkSize: config.minChunkSize,
    maxChunkSize: config.maxChunkSize,
    preserveHeadings: config.preserveHeadings,
    preserveTables: config.preserveTables,
    parentChildEnabled: config.parentChildEnabled,
    parentChunkSize: config.parentChunkSize,
    tokenizer: config.tokenizer,
    separators: config.separators,
  };
}

function jobStatusLabel(job: ChunkingJob) {
  if (job.status === "COMPLETED") return "已完成";
  if (job.status === "FAILED") return "失败";
  if (job.status === "RUNNING") return "执行中";
  return "排队中";
}

export default function ChunkingWorkbench({ document, chunks }: ChunkingWorkbenchProps) {
  const [view, setView] = useState<"config" | "results">("config");
  const [config, setConfig] = useState<ChunkingConfigInput>(DEFAULT_CHUNKING_CONFIG);
  const [serverConfig, setServerConfig] = useState<ChunkingConfigResponse | null>(null);
  const [job, setJob] = useState<ChunkingJob | null>(null);
  const [selectedChunkIndex, setSelectedChunkIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serviceConnected, setServiceConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedChunk = chunks[selectedChunkIndex] ?? chunks[0];
  const validationErrors = useMemo(() => validateChunkingConfig(config), [config]);
  const isDirty = !serverConfig || JSON.stringify(config) !== JSON.stringify(toInput(serverConfig));
  const jobActive = isChunkingJobActive(job);

  const loadConfiguration = async () => {
    try {
      const response = await knowledgeApi.getChunkingConfig(document.id);
      setServerConfig(response.data);
      setConfig(toInput(response.data));
      setJob(response.data.latestJob ?? null);
      setServiceConnected(true);
      setError(null);
    } catch {
      setServiceConnected(false);
      setError("配置服务未连接，当前显示默认配置，保存操作不会执行。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConfiguration();
  }, [document.id]);

  useEffect(() => {
    if (!jobActive || !job) return undefined;

    const timer = window.setInterval(async () => {
      try {
        const response = await knowledgeApi.getChunkingJob(job.id);
        setJob(response.data);
        setServiceConnected(true);
        if (!isChunkingJobActive(response.data)) {
          window.clearInterval(timer);
          await loadConfiguration();
        }
      } catch {
        setServiceConnected(false);
        setError("任务进度读取失败，数据库中的任务仍会继续执行。");
      }
    }, 700);

    return () => window.clearInterval(timer);
  }, [job?.id, jobActive]);

  const updateNumber = (field: keyof ChunkingConfigInput, value: string) => {
    setConfig((current) => ({ ...current, [field]: Number(value) }));
  };

  const saveAndRebuild = async () => {
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await knowledgeApi.updateChunkingConfig(document.id, config);
      setJob(response.data);
      setServiceConnected(true);
    } catch {
      setServiceConnected(false);
      setError("配置保存失败。当前线上版本未发生变化，请检查后端和数据库连接后重试。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>分块配置与结果</Typography>
          <Typography variant="caption" color="text.secondary">
            当前线上版本 v{serverConfig?.versionNumber ?? 1} · {document.chunks} 个 Chunk
          </Typography>
        </Box>
        <Chip
          icon={<Database size={13} />}
          label={serviceConnected ? "数据库已连接" : loading ? "连接中" : "数据库未连接"}
          size="small"
          color={serviceConnected ? "success" : "default"}
          variant="outlined"
        />
      </Box>

      {job && (
        <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, bgcolor: job.status === "FAILED" ? "#fff8f7" : "grey.50" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, mb: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700}>重建任务 #{job.id}</Typography>
              <Typography variant="caption" color="text.secondary">{job.message}</Typography>
            </Box>
            <Chip
              label={`${jobStatusLabel(job)} · ${job.progress}%`}
              size="small"
              color={job.status === "COMPLETED" ? "success" : job.status === "FAILED" ? "error" : "primary"}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={job.progress}
            color={job.status === "FAILED" ? "error" : job.status === "COMPLETED" ? "success" : "primary"}
            sx={{ height: 6, borderRadius: 3 }}
          />
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", mt: 1.25 }}>
            {CHUNKING_PROGRESS_STAGES.map((stage) => {
              const complete = job.progress >= stage.threshold;
              const active = job.stage === stage.id;
              return (
                <Box key={stage.id} sx={{ minWidth: 0, textAlign: "center", color: complete || active ? "primary.main" : "text.disabled" }}>
                  {complete ? <CheckCircle2 size={14} /> : <CircleDashed size={14} />}
                  <Typography variant="caption" sx={{ display: "block", fontSize: 10, color: "inherit" }}>{stage.label}</Typography>
                </Box>
              );
            })}
          </Box>
          {job.errorMessage && <Alert severity="error" sx={{ mt: 1.25 }}>{job.errorMessage}</Alert>}
        </Paper>
      )}

      {error && <Alert severity={serviceConnected ? "warning" : "error"} sx={{ mb: 1.5 }}>{error}</Alert>}

      <Tabs
        value={view}
        onChange={(_, value: "config" | "results") => setView(value)}
        aria-label="分块配置与结果"
        sx={{ minHeight: 36, mb: 1.5, borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Tab value="config" label="分块配置" sx={{ minHeight: 36, py: 0, fontSize: 12 }} />
        <Tab value="results" label="分块结果" sx={{ minHeight: 36, py: 0, fontSize: 12 }} />
      </Tabs>

      {view === "config" && (
        <Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.25 }}>
            <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
              <Typography variant="caption" color="text.secondary">主要分块方式</Typography>
              <Select
                fullWidth
                size="small"
                value={config.strategy}
                disabled={jobActive}
                onChange={(event) => setConfig((current) => ({ ...current, strategy: event.target.value as ChunkingConfigInput["strategy"] }))}
                sx={{ mt: 0.5, bgcolor: "background.paper" }}
              >
                {CHUNKING_STRATEGIES.map((strategy) => (
                  <MenuItem key={strategy.value} value={strategy.value}>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{strategy.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{strategy.description}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <TextField label="Chunk 长度" type="number" size="small" value={config.chunkSize} disabled={jobActive} onChange={(event) => updateNumber("chunkSize", event.target.value)} inputProps={{ min: 64, step: 32 }} />
            <TextField label="Overlap" type="number" size="small" value={config.overlap} disabled={jobActive} onChange={(event) => updateNumber("overlap", event.target.value)} inputProps={{ min: 0, step: 16 }} />
            <TextField label="最小长度" type="number" size="small" value={config.minChunkSize} disabled={jobActive} onChange={(event) => updateNumber("minChunkSize", event.target.value)} inputProps={{ min: 1, step: 16 }} />
            <TextField label="最大长度" type="number" size="small" value={config.maxChunkSize} disabled={jobActive} onChange={(event) => updateNumber("maxChunkSize", event.target.value)} inputProps={{ min: 64, step: 32 }} />
            <TextField label="Parent Chunk 长度" type="number" size="small" value={config.parentChunkSize} disabled={jobActive || !config.parentChildEnabled} onChange={(event) => updateNumber("parentChunkSize", event.target.value)} inputProps={{ min: 64, step: 64 }} />
            <Box>
              <Typography variant="caption" color="text.secondary">Tokenizer</Typography>
              <Select fullWidth size="small" value={config.tokenizer} disabled={jobActive} onChange={(event) => setConfig((current) => ({ ...current, tokenizer: event.target.value }))} sx={{ mt: 0.5, bgcolor: "background.paper" }}>
                <MenuItem value="cl100k_base">cl100k_base</MenuItem>
                <MenuItem value="bge-m3">bge-m3</MenuItem>
                <MenuItem value="sentencepiece">sentencepiece</MenuItem>
              </Select>
            </Box>
            <TextField
              label="分隔符优先级"
              size="small"
              value={config.separators}
              disabled={jobActive}
              onChange={(event) => setConfig((current) => ({ ...current, separators: event.target.value }))}
              sx={{ gridColumn: { sm: "1 / -1" } }}
            />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, mt: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
            <FormControlLabel control={<Switch size="small" checked={config.preserveHeadings} disabled={jobActive} onChange={(event) => setConfig((current) => ({ ...current, preserveHeadings: event.target.checked }))} />} label={<Typography variant="caption">保留标题</Typography>} sx={{ m: 0, px: 1.25, py: 0.5 }} />
            <FormControlLabel control={<Switch size="small" checked={config.preserveTables} disabled={jobActive} onChange={(event) => setConfig((current) => ({ ...current, preserveTables: event.target.checked }))} />} label={<Typography variant="caption">表格不拆分</Typography>} sx={{ m: 0, px: 1.25, py: 0.5, borderLeft: { sm: "1px solid" }, borderColor: "divider" }} />
            <FormControlLabel control={<Switch size="small" checked={config.parentChildEnabled} disabled={jobActive} onChange={(event) => setConfig((current) => ({ ...current, parentChildEnabled: event.target.checked }))} />} label={<Typography variant="caption">Parent-Child</Typography>} sx={{ m: 0, px: 1.25, py: 0.5, borderLeft: { sm: "1px solid" }, borderColor: "divider" }} />
          </Box>
          {validationErrors.length > 0 && <Alert severity="warning" sx={{ mt: 1.25 }}>{validationErrors[0]}</Alert>}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, mt: 1.5 }}>
            <Button
              size="small"
              variant="text"
              startIcon={<RotateCcw size={14} />}
              disabled={!serverConfig || jobActive || !isDirty}
              onClick={() => serverConfig && setConfig(toInput(serverConfig))}
            >
              恢复线上配置
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={saving || jobActive ? <RefreshCw size={14} /> : <Save size={14} />}
              disabled={saving || jobActive || !isDirty || validationErrors.length > 0}
              onClick={() => void saveAndRebuild()}
            >
              {jobActive ? "正在重建" : "保存并重建"}
            </Button>
          </Box>
        </Box>
      )}

      {view === "results" && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "190px minmax(0, 1fr)" }, border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
          <Box sx={{ borderRight: { md: "1px solid" }, borderBottom: { xs: "1px solid", md: 0 }, borderColor: "divider", bgcolor: "grey.50" }}>
            {chunks.map((chunk, index) => (
              <ButtonBase
                key={chunk.id}
                onClick={() => setSelectedChunkIndex(index)}
                sx={{ width: "100%", display: "block", textAlign: "left", px: 1.5, py: 1.25, borderBottom: "1px solid", borderColor: "divider", bgcolor: index === selectedChunkIndex ? "rgba(103, 58, 183, 0.08)" : "transparent", boxShadow: index === selectedChunkIndex ? "inset 3px 0 0 #673ab7" : "none" }}
              >
                <Typography variant="body2" fontWeight={700} fontFamily="monospace">{chunk.id}</Typography>
                <Typography variant="caption" color="text.secondary">Page {chunk.page} · {chunk.tokens} tokens</Typography>
              </ButtonBase>
            ))}
          </Box>
          {selectedChunk && (
            <Box sx={{ minWidth: 0, p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
                <Box>
                  <Typography variant="body2" fontWeight={700}>{selectedChunk.heading}</Typography>
                  <Typography variant="caption" color="text.secondary" fontFamily="monospace">{selectedChunk.id} · {selectedChunk.position}</Typography>
                </Box>
                <Chip label={selectedChunk.embeddingStatus} size="small" color="success" variant="outlined" />
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", border: "1px solid", borderColor: "divider", borderRadius: 1.5, overflow: "hidden", mb: 1.5 }}>
                {[["Page", selectedChunk.page], ["Parent", selectedChunk.parentId], ["Tokens", selectedChunk.tokens], ["Overlap", selectedChunk.overlap]].map(([label, value], index) => (
                  <Box key={label} sx={{ p: 1.25, minWidth: 0, borderRight: index < 3 ? "1px solid" : 0, borderColor: "divider" }}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={700} fontFamily="monospace" mt={0.25} sx={{ overflowWrap: "anywhere" }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary">Chunk 正文</Typography>
              <Paper variant="outlined" sx={{ mt: 0.5, p: 1.75, bgcolor: "grey.50", borderLeft: "4px solid", borderLeftColor: "primary.main" }}>
                <Typography variant="body2" lineHeight={1.75}>{selectedChunk.content}</Typography>
              </Paper>
              <Box sx={{ mt: 1.5, display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                <Chip icon={<Split size={13} />} label="文档结构切分" size="small" variant="outlined" />
                <Chip label={`overlap ${selectedChunk.overlap}`} size="small" variant="outlined" />
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
