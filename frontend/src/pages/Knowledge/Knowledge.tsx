import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Database, FileText, RefreshCw, Search, Split, WandSparkles, X } from "lucide-react";
import DocumentStageDetails from "./DocumentStageDetails";
import { normalizeSampleSize } from "./Knowledge.data";
import { knowledgeApi } from "../../services/api";
import type { KnowledgeDocument } from "./Knowledge.data";

type KnowledgeStats = {
  totalDocuments: number;
  totalChunks: number;
  currentIndex: string;
  lastSync: string;
  databaseType?: string;
  sqliteSize?: string;
  aliasCount?: number;
};

type DetailStage = "overview" | "records" | "chunking" | "raw";

const DETAIL_STAGES: Array<{ id: DetailStage; label: string; icon: typeof FileText }> = [
  { id: "overview", label: "概览", icon: FileText },
  { id: "records", label: "抽样记录", icon: WandSparkles },
  { id: "chunking", label: "分块配置", icon: Split },
  { id: "raw", label: "原始 JSON", icon: Database },
];

function mapDocument(item: Record<string, any>): KnowledgeDocument {
  return {
    id: Number(item.id ?? 0),
    name: String(item.fileName || item.title || item.sourceDatabase || "unknown"),
    source: String(item.category || item.sourcePath || item.sourceDatabase || "-"),
    parser: String(item.parserVersion || item.parserName || "-"),
    chunks: Number(item.recordCount ?? item.chunkCount ?? 0),
    duplicateStatus: String(item.evidenceClass || item.dedupStatus || "-"),
    ingestStatus: String(item.processStatus || "INGESTED"),
    updatedAt: String(item.snapshotRelease || item.updatedAt || "-"),
    previewStatus: "not-mounted",
    sourceDatabase: String(item.sourceDatabase || item.sourcePath || ""),
    title: String(item.title || item.fileName || ""),
    description: String(item.description || ""),
    category: String(item.category || ""),
    defaultEntityType: String(item.defaultEntityType || ""),
    evidenceClass: String(item.evidenceClass || ""),
    homepage: String(item.homepage || ""),
    license: String(item.license || ""),
    snapshotRelease: String(item.snapshotRelease || ""),
    parserVersion: String(item.parserVersion || item.parserName || ""),
    recordCount: Number(item.recordCount ?? item.chunkCount ?? 0),
    sourceFileCount: Number(item.sourceFileCount ?? item.pageCount ?? 1),
    sampleRecords: Array.isArray(item.sampleRecords) ? item.sampleRecords : undefined,
    fieldStats: Array.isArray(item.fieldStats) ? item.fieldStats : undefined,
  };
}

function unwrapDocuments(data: unknown): Record<string, any>[] {
  if (Array.isArray(data)) return data as Record<string, any>[];
  if (data && typeof data === "object" && Array.isArray((data as { content?: unknown }).content)) {
    return (data as { content: Record<string, any>[] }).content;
  }
  return [];
}

type SourceGroup = {
  sourceName: string;
  category: string;
  recordCount: number;
  sourceFileCount: number;
  evidenceClass: string;
  documents: KnowledgeDocument[];
};

export default function Knowledge() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null);
  const [stage, setStage] = useState<DetailStage>("overview");
  const [queryInput, setQueryInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [sampleSizeInput, setSampleSizeInput] = useState("10");

  const loadKnowledge = async (keyword = queryInput) => {
    setLoading(true);
    try {
      const [docsResponse, statsResponse] = await Promise.all([
        knowledgeApi.listDocuments({
          keyword,
          status: statusFilter === "all" ? "" : statusFilter,
          fileType: fileTypeFilter === "all" ? "" : fileTypeFilter,
          page: "0",
          size: "50",
        }),
        knowledgeApi.getStats(),
      ]);
      setDocuments(unwrapDocuments(docsResponse.data).map(mapDocument));
      setStats(statsResponse.data as KnowledgeStats);
      setError(null);
    } catch (exception) {
      setError("知识库后端未连接，当前页面不会显示真实数据。");
      setDocuments([]);
      setStats(null);
      void exception;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadKnowledge("");
  }, []);

  const openDocument = async (document: KnowledgeDocument) => {
    setDetailLoading(true);
    try {
      const response = await knowledgeApi.getDocument(document.id);
      setSelectedDocument(mapDocument(response.data));
      setStage("overview");
    } catch {
      setSelectedDocument(document);
      setStage("overview");
      setError("文档详情加载失败，已使用列表中的摘要数据。");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDocumentDialog = () => setSelectedDocument(null);

  const metrics = useMemo(() => [
    ["数据源", stats?.totalDocuments ?? 0],
    ["记录数", stats?.totalChunks ?? 0],
    ["索引", stats?.currentIndex ?? "-"],
    ["SQLite", stats?.sqliteSize ?? "-"],
    ["别名", stats?.aliasCount ?? 0],
  ] as const, [stats]);

  const sourceGroups = useMemo<SourceGroup[]>(() => {
    const groups = new Map<string, SourceGroup>();

    documents.forEach((document) => {
      const sourceName = document.sourceDatabase || document.source || document.name;
      const existing = groups.get(sourceName);
      if (existing) {
        existing.documents.push(document);
        existing.recordCount += Number(document.recordCount ?? document.chunks ?? 0);
        existing.sourceFileCount += Number(document.sourceFileCount ?? 0);
        return;
      }

      groups.set(sourceName, {
        sourceName,
        category: document.category || document.source || "-",
        recordCount: Number(document.recordCount ?? document.chunks ?? 0),
        sourceFileCount: Number(document.sourceFileCount ?? 0),
        evidenceClass: document.evidenceClass || document.duplicateStatus || "-",
        documents: [document],
      });
    });

    return Array.from(groups.values()).sort((left, right) =>
      left.sourceName.localeCompare(right.sourceName, "en", { sensitivity: "base" }),
    );
  }, [documents]);

  const sampleCount = normalizeSampleSize(sampleSizeInput);

  return (
    <Box>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "flex-start" }, gap: 2, mb: 2.5 }}>
        <Box>
          <Typography variant="h1">知识库 / phase-db</Typography>
          <Typography variant="body2" color="text.secondary">
            直接读取后端知识库与 SQLite SDB 内容
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="outlined" size="small" startIcon={<RefreshCw size={14} />} onClick={() => void loadKnowledge(queryInput)}>
            同步数据
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(5, minmax(0, 1fr))" }, gap: 0, py: 0 }}>
          {metrics.map(([label, value]) => (
            <Box key={label} sx={{ p: 2, minWidth: 0, borderRight: { md: "1px solid" }, borderBottom: { xs: "1px solid", md: 0 }, borderColor: "divider" }}>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="body2" fontWeight={800} sx={{ mt: 0.5, overflowWrap: "anywhere" }}>{String(value)}</Typography>
            </Box>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Box sx={{ px: 2.5, pt: 2.25, pb: 1.75, display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2, flexDirection: { xs: "column", md: "row" } }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>数据源列表</Typography>
              <Typography variant="caption" color="text.secondary">当前读取 `source_metadata` 与 `sources` 表中的真实知识库来源</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              <Chip label="sources" size="small" variant="outlined" />
              <Chip label="source_metadata" size="small" variant="outlined" />
              <Chip label={loading ? "加载中" : `${sourceGroups.length} 数据源`} size="small" color="success" />
            </Box>
          </Box>
          <Divider />
          <Box sx={{ display: "flex", gap: 1, p: 2, flexWrap: { xs: "wrap", md: "nowrap" } }}>
            <TextField
              size="small"
              placeholder="搜索源数据库、类别、许可证或描述"
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void loadKnowledge(queryInput);
                }
              }}
              sx={{ flex: 1, minWidth: { xs: "100%", md: 280 } }}
              InputProps={{ startAdornment: <Search size={14} style={{ marginRight: 8, opacity: 0.7 }} /> }}
            />
            <Select size="small" value={fileTypeFilter} onChange={(event) => setFileTypeFilter(event.target.value)} sx={{ bgcolor: "background.paper", minWidth: 144 }}>
              <MenuItem value="all">全部类型</MenuItem>
              <MenuItem value="SDB_SOURCE">SDB_SOURCE</MenuItem>
            </Select>
            <Select size="small" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} sx={{ bgcolor: "background.paper", minWidth: 144 }}>
              <MenuItem value="all">全部状态</MenuItem>
              <MenuItem value="INGESTED">INGESTED</MenuItem>
            </Select>
            <Box sx={{ height: 40, display: "flex", alignItems: "center", gap: 0.75, pl: 1.25, pr: 0.75, border: "1px solid", borderColor: "divider", borderRadius: 2.5, bgcolor: "background.paper" }}>
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>抽样数</Typography>
              <TextField
                type="number"
                size="small"
                variant="standard"
                value={sampleSizeInput}
                onChange={(event) => setSampleSizeInput(event.target.value)}
                onBlur={() => setSampleSizeInput(String(normalizeSampleSize(sampleSizeInput)))}
                inputProps={{ min: 1, step: 1, inputMode: "numeric" }}
                InputProps={{ disableUnderline: true, endAdornment: <Typography variant="caption" color="text.secondary">个</Typography> }}
                sx={{ width: 72, bgcolor: "background.paper", "& input": { py: 1, px: 0.25, textAlign: "right", fontSize: 12, fontWeight: 700 } }}
              />
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Database size={14} />}
              onClick={() => {
                setFeedbackOpen(true);
                setQueryInput("");
                void loadKnowledge("");
              }}
            >
              重新抽样
            </Button>
          </Box>
          {error && <Alert severity="warning" sx={{ mx: 2, mb: 2 }}>{error}</Alert>}
          <Box sx={{ px: 2, pb: 2 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" }, gap: 1 }}>
              {sourceGroups.map((group, index) => {
                const primaryDocument = group.documents[0];

                return (
                  <Box
                    key={group.sourceName}
                    role="button"
                    tabIndex={0}
                    aria-label={`打开 ${group.sourceName} 数据源`}
                    onClick={() => primaryDocument && void openDocument(primaryDocument)}
                    onKeyDown={(event) => {
                      if ((event.key === "Enter" || event.key === " ") && primaryDocument) {
                        event.preventDefault();
                        void openDocument(primaryDocument);
                      }
                    }}
                    sx={{
                      minWidth: 0,
                      p: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1.5,
                      bgcolor: "background.paper",
                      cursor: primaryDocument ? "pointer" : "default",
                      "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                      "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <Typography variant="caption" fontFamily="monospace" fontWeight={800} color="text.secondary" sx={{ width: 24 }}>
                        {String(index + 1).padStart(2, "0")}
                      </Typography>
                      <Database size={15} />
                      <Typography variant="body2" fontWeight={800} sx={{ minWidth: 0, flex: 1, overflowWrap: "anywhere" }}>
                        {group.sourceName}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, overflowWrap: "anywhere" }}>
                      {group.category}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                      <Chip label={`${group.recordCount.toLocaleString()} records`} size="small" variant="outlined" />
                      <Chip label={`${group.sourceFileCount.toLocaleString()} files`} size="small" variant="outlined" />
                      <Chip label={group.evidenceClass} size="small" color="success" variant="outlined" />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
          <Box sx={{ maxHeight: { xs: 540, md: 640 }, overflow: "auto" }}>
            <Table size="small" stickyHeader sx={{ minWidth: 1080 }}>
              <TableHead>
                <TableRow>
                  {["序号", "数据源", "类别", "解析器", "记录数", "源文件", "证据", "状态", "更新时间"].map((heading) => (
                    <TableCell key={heading} sx={{ fontSize: 11, fontWeight: 600 }}>{heading}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {sourceGroups.map((group, groupIndex) => (
                  <Fragment key={group.sourceName}>
                    <TableRow key={`${group.sourceName}-group`}>
                      <TableCell colSpan={9} sx={{ bgcolor: "grey.50", borderTop: "1px solid", borderColor: "divider", py: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                          <Typography variant="caption" fontFamily="monospace" fontWeight={800} color="text.secondary">
                            {String(groupIndex + 1).padStart(2, "0")}
                          </Typography>
                          <Database size={14} />
                          <Typography variant="body2" fontWeight={800}>{group.sourceName}</Typography>
                          <Chip label={group.category} size="small" variant="outlined" />
                          <Chip label={`${group.recordCount.toLocaleString()} records`} size="small" color="primary" variant="outlined" />
                        </Box>
                      </TableCell>
                    </TableRow>
                    {group.documents.map((document, documentIndex) => (
                      <TableRow
                        key={document.id}
                        hover
                        tabIndex={0}
                        aria-label={`打开 ${document.name} 知识源`}
                        onClick={() => void openDocument(document)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            void openDocument(document);
                          }
                        }}
                        sx={{ cursor: "pointer", "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -2 } }}
                      >
                        <TableCell sx={{ fontSize: 11, fontFamily: "monospace", width: 72 }}>
                          {group.documents.length > 1 ? `${groupIndex + 1}.${documentIndex + 1}` : groupIndex + 1}
                        </TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                            <FileText size={14} />
                            <Typography component="span" variant="body2" fontSize={11} fontWeight={700} sx={{ flex: 1, overflowWrap: "anywhere" }}>
                              {document.name}
                            </Typography>
                            <Tooltip title="打开知识源详情">
                              <IconButton size="small" aria-label={`打开 ${document.name} 知识源`} sx={{ color: "primary.main" }}>
                                <Search size={14} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, overflowWrap: "anywhere" }}>
                            {document.sourceDatabase}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{document.category || document.source}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{document.parserVersion || document.parser}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: "monospace" }}>{Number(document.recordCount ?? document.chunks).toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: "monospace" }}>{Number(document.sourceFileCount ?? 1).toLocaleString()}</TableCell>
                        <TableCell><Chip label={document.evidenceClass || document.duplicateStatus} color="success" size="small" /></TableCell>
                        <TableCell><Chip label={document.ingestStatus} color="success" size="small" /></TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{document.updatedAt}</TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedDocument)}
        onClose={closeDocumentDialog}
        maxWidth="xl"
        fullWidth
        aria-labelledby="knowledge-source-title"
        PaperProps={{
          sx: {
            m: { xs: 1, sm: 2.5 },
            height: { xs: "calc(100% - 16px)", sm: "calc(100% - 40px)" },
            maxHeight: "none",
            overflow: "hidden",
          },
        }}
      >
        {selectedDocument && (
          <>
            <DialogTitle id="knowledge-source-title" sx={{ px: { xs: 2, sm: 2.5 }, py: 1.5, display: "flex", alignItems: "center", gap: 1.25 }}>
              <Box sx={{ width: 36, height: 36, display: "grid", placeItems: "center", bgcolor: "action.hover", border: "1px solid", borderColor: "divider", borderRadius: 1.5, flexShrink: 0 }}>
                <Database size={18} color="#673ab7" />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="h3" sx={{ overflowWrap: "anywhere" }}>{selectedDocument.title || selectedDocument.name}</Typography>
                <Typography variant="caption" color="text.secondary">后端知识源 · {selectedDocument.sourceDatabase || selectedDocument.source}</Typography>
              </Box>
              <Chip label={`${Number(selectedDocument.recordCount ?? selectedDocument.chunks).toLocaleString()} records`} size="small" color="primary" sx={{ display: { xs: "none", sm: "inline-flex" } }} />
              <Chip label={selectedDocument.ingestStatus} size="small" color="success" sx={{ display: { xs: "none", sm: "inline-flex" } }} />
              <Tooltip title="关闭">
                <IconButton aria-label="关闭知识源详情" onClick={closeDocumentDialog}>
                  <X size={18} />
                </IconButton>
              </Tooltip>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 0, flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.12fr) minmax(420px, 0.88fr)" }, gridTemplateRows: { xs: "minmax(220px, 34%) minmax(0, 66%)", lg: "minmax(0, 1fr)" }, minHeight: 0 }}>
              <Box sx={{ minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", bgcolor: "grey.100", borderRight: { lg: "1px solid" }, borderBottom: { xs: "1px solid", lg: 0 }, borderColor: "divider" }}>
                <Box sx={{ minHeight: 48, px: 2, py: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Database size={15} />
                    <Typography variant="body2" fontWeight={700}>后端知识源</Typography>
                  </Box>
                  <Chip label={loading || detailLoading ? "读取中" : "实时后端"} size="small" color="success" variant="outlined" />
                </Box>
                <Box sx={{ flex: 1, minHeight: 0, p: { xs: 1.25, sm: 2 }, display: "grid" }}>
                  <Paper variant="outlined" sx={{ minHeight: { xs: 200, lg: 520 }, p: 2, bgcolor: "background.paper" }}>
                    <Typography variant="caption" color="text.secondary">源路径</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, fontFamily: "monospace", overflowWrap: "anywhere" }}>{selectedDocument.sourceDatabase || selectedDocument.source}</Typography>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="caption" color="text.secondary">描述</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap", lineHeight: 1.75 }}>{selectedDocument.description || "-"}</Typography>
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
                      {[
                        ["Category", selectedDocument.category || "-"],
                        ["Evidence", selectedDocument.evidenceClass || "-"],
                        ["Parser", selectedDocument.parserVersion || selectedDocument.parser],
                        ["License", selectedDocument.license || "-"],
                      ].map(([label, value]) => (
                        <Box key={label} sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.25, bgcolor: "grey.50" }}>
                          <Typography variant="caption" color="text.secondary">{label}</Typography>
                          <Typography variant="body2" fontWeight={700} sx={{ overflowWrap: "anywhere" }}>{value}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Box>
              </Box>

              <Box sx={{ minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", bgcolor: "background.paper" }}>
                <Tabs value={stage} onChange={(_, value: DetailStage) => setStage(value)} variant="scrollable" scrollButtons="auto" aria-label="知识源处理阶段" sx={{ px: 1, minHeight: 49, borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }}>
                  {DETAIL_STAGES.map((item) => (
                    <Tab key={item.id} value={item.id} icon={<item.icon size={15} />} iconPosition="start" label={item.label} sx={{ minHeight: 48, minWidth: "auto", px: 1.5, fontSize: 12 }} />
                  ))}
                </Tabs>
                <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: { xs: 2, sm: 2.5 } }}>
                  <DocumentStageDetails key={selectedDocument.id} document={selectedDocument} stage={stage} />
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      <Snackbar
        open={feedbackOpen}
        autoHideDuration={2200}
        onClose={() => setFeedbackOpen(false)}
        message={`已从真实后端重新抽样 · ${sampleCount} 个记录视图`}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
