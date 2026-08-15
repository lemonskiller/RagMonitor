import { useState } from "react";
import {
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
import {
  Database,
  Dices,
  Eye,
  FileText,
  Image,
  RefreshCw,
  Split,
  Upload,
  WandSparkles,
  X,
} from "lucide-react";
import DocumentStageDetails from "./DocumentStageDetails";
import {
  DEFAULT_SAMPLE_SIZE,
  KNOWLEDGE_DOCUMENTS,
  normalizeSampleSize,
} from "./Knowledge.data";
import type { KnowledgeDocument } from "./Knowledge.data";

const PDF_STAGES = [
  { id: "overview", icon: FileText, label: "文档概览" },
  { id: "parsing", icon: WandSparkles, label: "解析与清洗" },
  { id: "chunking", icon: Split, label: "分块预览" },
  { id: "multimodal", icon: Image, label: "多模态解析" },
] as const;

type PdfStage = (typeof PDF_STAGES)[number]["id"];

export default function Knowledge() {
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null);
  const [pdfStage, setPdfStage] = useState<PdfStage>("overview");
  const [sampleSizeInput, setSampleSizeInput] = useState(String(DEFAULT_SAMPLE_SIZE));
  const [sampleFeedbackOpen, setSampleFeedbackOpen] = useState(false);

  const openDocument = (document: KnowledgeDocument) => {
    setSelectedDocument(document);
    setPdfStage("overview");
  };

  const closeDocumentDialog = () => setSelectedDocument(null);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "flex-start" },
          gap: 2,
          mb: 2.5,
        }}
      >
        <Box>
          <Typography variant="h1">知识库 / phase-db</Typography>
          <Typography variant="body2" color="text.secondary">
            文档管理与 PDF 粒度处理工作台
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="outlined" size="small" startIcon={<Database size={14} />}>
            切换知识库
          </Button>
          <Button variant="outlined" size="small" startIcon={<RefreshCw size={14} />}>
            同步数据
          </Button>
          <Button variant="contained" size="small" startIcon={<Upload size={14} />}>
            上传文档
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 1.5, md: 3 },
            py: 2,
            overflowX: "auto",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 3, borderRight: "1px solid", borderColor: "divider", flexShrink: 0 }}>
            <Database size={22} color="#673ab7" />
            <Box>
              <Typography variant="body2" fontWeight={700}>phase-db</Typography>
              <Typography variant="caption" color="text.secondary">S3 / phase-prod</Typography>
            </Box>
          </Box>
          {[["文档", "18,420"], ["Chunk", "162,804"], ["当前索引", "idx-024"], ["最近同步", "12 分钟前"]].map(([label, value]) => (
            <Box key={label} sx={{ px: { xs: 1.5, md: 3 }, borderRight: "1px solid", borderColor: "grey.100", flexShrink: 0 }}>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="body2" fontWeight={700} fontFamily="monospace" mt={0.5}>{value}</Typography>
            </Box>
          ))}
          <Chip label="可用" color="success" size="small" />
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Box sx={{ px: 2.5, pt: 2.25, pb: 1.75, display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2, flexDirection: { xs: "column", md: "row" } }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>文档列表</Typography>
              <Typography variant="caption" color="text.secondary">解析、分块和多模态结果按 PDF 独立管理</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              {["原文", "解析清洗", "分块", "多模态"].map((label) => (
                <Chip key={label} label={label} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
          <Divider />
          <Box sx={{ display: "flex", gap: 1, p: 2, flexWrap: { xs: "wrap", md: "nowrap" } }}>
            <TextField size="small" placeholder="搜索文件名、标签或来源" sx={{ flex: 1, minWidth: { xs: "100%", md: 240 } }} />
            <Select size="small" defaultValue="all" sx={{ bgcolor: "background.paper", minWidth: 112 }}>
              <MenuItem value="all">全部类型</MenuItem>
            </Select>
            <Select size="small" defaultValue="all" sx={{ bgcolor: "background.paper", minWidth: 112 }}>
              <MenuItem value="all">全部状态</MenuItem>
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
                inputProps={{ min: 1, step: 1, inputMode: "numeric", "aria-label": "随机抽样数量" }}
                InputProps={{ disableUnderline: true, endAdornment: <Typography variant="caption" color="text.secondary">个</Typography> }}
                sx={{ width: 72, bgcolor: "background.paper", "& input": { py: 1, px: 0.25, textAlign: "right", fontSize: 12, fontWeight: 700 } }}
              />
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Dices size={14} />}
              onClick={() => {
                setSampleSizeInput(String(normalizeSampleSize(sampleSizeInput)));
                setSampleFeedbackOpen(true);
              }}
            >
              随机抽样
            </Button>
          </Box>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  {["文档", "来源", "解析器", "Chunk", "原文", "去重", "状态", "更新时间"].map((heading) => (
                    <TableCell key={heading} sx={{ fontSize: 11, fontWeight: 600 }}>{heading}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {KNOWLEDGE_DOCUMENTS.map((document) => (
                  <TableRow
                    key={document.name}
                    hover
                    tabIndex={0}
                    aria-label={`打开 ${document.name} PDF 工作台`}
                    onClick={() => openDocument(document)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openDocument(document);
                      }
                    }}
                    sx={{ cursor: "pointer", "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -2 } }}
                  >
                    <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <FileText size={14} />
                        <Typography component="span" variant="body2" fontSize={11} fontWeight={700} sx={{ flex: 1 }}>{document.name}</Typography>
                        <Tooltip title="打开 PDF 工作台">
                          <IconButton size="small" aria-label={`打开 ${document.name} PDF 工作台`} sx={{ color: "primary.main" }}>
                            <Eye size={14} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{document.source}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{document.parser}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: "monospace" }}>{document.chunks}</TableCell>
                    <TableCell>
                      <Chip
                        label={document.previewStatus === "available" ? "可预览" : "未挂载"}
                        color={document.previewStatus === "available" ? "success" : "default"}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell><Chip label={document.duplicateStatus} color="success" size="small" /></TableCell>
                    <TableCell><Chip label={document.ingestStatus} color="success" size="small" /></TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{document.updatedAt}</TableCell>
                  </TableRow>
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
        aria-labelledby="pdf-workbench-title"
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
            <DialogTitle id="pdf-workbench-title" sx={{ px: { xs: 2, sm: 2.5 }, py: 1.5, display: "flex", alignItems: "center", gap: 1.25 }}>
              <Box sx={{ width: 36, height: 36, display: "grid", placeItems: "center", bgcolor: "action.hover", border: "1px solid", borderColor: "divider", borderRadius: 1.5, flexShrink: 0 }}>
                <FileText size={18} color="#673ab7" />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="h3" sx={{ overflowWrap: "anywhere" }}>{selectedDocument.name}</Typography>
                <Typography variant="caption" color="text.secondary">PDF 工作台 · {selectedDocument.source}</Typography>
              </Box>
              <Chip label={`${selectedDocument.chunks} Chunks`} size="small" color="primary" sx={{ display: { xs: "none", sm: "inline-flex" } }} />
              <Chip label={selectedDocument.ingestStatus} size="small" color="success" sx={{ display: { xs: "none", sm: "inline-flex" } }} />
              <Tooltip title="关闭">
                <IconButton aria-label="关闭 PDF 工作台" onClick={closeDocumentDialog}>
                  <X size={18} />
                </IconButton>
              </Tooltip>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 0, flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.12fr) minmax(420px, 0.88fr)" }, gridTemplateRows: { xs: "minmax(220px, 42%) minmax(0, 58%)", lg: "minmax(0, 1fr)" }, minHeight: 0 }}>
              <Box sx={{ minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", bgcolor: "grey.100", borderRight: { lg: "1px solid" }, borderBottom: { xs: "1px solid", lg: 0 }, borderColor: "divider" }}>
                <Box sx={{ minHeight: 48, px: 2, py: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Eye size={15} />
                    <Typography variant="body2" fontWeight={700}>原始 PDF</Typography>
                  </Box>
                  <Chip
                    label={selectedDocument.previewStatus === "available" ? "完整文件" : "文件未挂载"}
                    size="small"
                    color={selectedDocument.previewStatus === "available" ? "success" : "default"}
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ flex: 1, minHeight: 0, p: { xs: 1.25, sm: 2 }, display: "grid" }}>
                  {selectedDocument.previewUrl ? (
                    <Box
                      component="iframe"
                      src={selectedDocument.previewUrl}
                      title={`${selectedDocument.name} 原始 PDF`}
                      sx={{ width: "100%", height: "100%", minHeight: { xs: 200, lg: 560 }, border: "1px solid", borderColor: "divider", borderRadius: 1, bgcolor: "background.paper" }}
                    />
                  ) : (
                    <Paper
                      variant="outlined"
                      sx={{ minHeight: { xs: 200, lg: 520 }, display: "grid", placeItems: "center", textAlign: "center", p: 4, bgcolor: "background.paper", borderStyle: "dashed" }}
                    >
                      <Box sx={{ maxWidth: 300 }}>
                        <Box sx={{ width: 54, height: 66, mx: "auto", mb: 2, display: "grid", placeItems: "center", border: "1px solid", borderColor: "divider", borderRadius: 1.5, bgcolor: "action.hover" }}>
                          <FileText size={26} color="#673ab7" />
                        </Box>
                        <Typography variant="subtitle2" fontWeight={700}>完整 PDF 尚未挂载</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75, overflowWrap: "anywhere" }}>
                          {selectedDocument.source}/{selectedDocument.name}
                        </Typography>
                      </Box>
                    </Paper>
                  )}
                </Box>
              </Box>

              <Box sx={{ minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", bgcolor: "background.paper" }}>
                <Tabs
                  value={pdfStage}
                  onChange={(_, value: PdfStage) => setPdfStage(value)}
                  variant="scrollable"
                  scrollButtons="auto"
                  aria-label="PDF 处理阶段"
                  sx={{ px: 1, minHeight: 49, borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }}
                >
                  {PDF_STAGES.map((stage) => (
                    <Tab key={stage.id} value={stage.id} icon={<stage.icon size={15} />} iconPosition="start" label={stage.label} sx={{ minHeight: 48, minWidth: "auto", px: 1.5, fontSize: 12 }} />
                  ))}
                </Tabs>

                <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: { xs: 2, sm: 2.5 } }}>
                  {pdfStage === "overview" && (
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} mb={1.5}>文档概览</Typography>
                      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
                        {[
                          ["文档", selectedDocument.name],
                          ["来源", selectedDocument.source],
                          ["解析器", selectedDocument.parser],
                          ["Chunk", selectedDocument.chunks.toLocaleString()],
                          ["去重", selectedDocument.duplicateStatus],
                          ["状态", selectedDocument.ingestStatus],
                          ["更新时间", selectedDocument.updatedAt],
                          ["原文", selectedDocument.previewStatus === "available" ? "完整 PDF" : "未挂载"],
                        ].map(([label, value], index) => (
                          <Box key={label} sx={{ minWidth: 0, px: 2, py: 1.75, borderRight: { sm: index % 2 === 0 ? "1px solid" : 0 }, borderBottom: { xs: index < 7 ? "1px solid" : 0, sm: index < 6 ? "1px solid" : 0 }, borderColor: "divider" }}>
                            <Typography variant="caption" color="text.secondary">{label}</Typography>
                            <Typography variant="body2" fontWeight={700} mt={0.5} sx={{ overflowWrap: "anywhere", fontFamily: label === "Chunk" ? "monospace" : "inherit" }}>{value}</Typography>
                          </Box>
                        ))}
                      </Box>
                      <Typography variant="subtitle2" fontWeight={700} mt={2.5} mb={1.25}>处理进度</Typography>
                      <Box sx={{ display: "grid", gap: 1 }}>
                        {[
                          ["解析与清洗", selectedDocument.parser, "已完成"],
                          ["分块", `${selectedDocument.chunks} 个 Chunk`, "已完成"],
                          ["多模态解析", "文本 / 图片 / 表格", "待复核"],
                        ].map(([label, detail, status]) => (
                          <Paper key={label} variant="outlined" sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1.25 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: status === "已完成" ? "success.main" : "warning.main", flexShrink: 0 }} />
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography variant="body2" fontWeight={700}>{label}</Typography>
                              <Typography variant="caption" color="text.secondary">{detail}</Typography>
                            </Box>
                            <Chip label={status} size="small" color={status === "已完成" ? "success" : "warning"} variant="outlined" />
                          </Paper>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {pdfStage !== "overview" && (
                    <DocumentStageDetails key={selectedDocument.name} document={selectedDocument} stage={pdfStage} />
                  )}
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
      <Snackbar
        open={sampleFeedbackOpen}
        autoHideDuration={2600}
        onClose={() => setSampleFeedbackOpen(false)}
        message={`已创建随机抽样 · ${normalizeSampleSize(sampleSizeInput)} 个文档`}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
