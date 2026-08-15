import { useState } from "react";
import { Box, ButtonBase, Chip, Divider, Paper, Typography } from "@mui/material";
import { Image, Sigma, Table2, WandSparkles } from "lucide-react";
import ChunkingWorkbench from "./ChunkingWorkbench";
import { getKnowledgeDocumentDetails } from "./Knowledge.data";
import type { KnowledgeDocument } from "./Knowledge.data";

type DetailStage = "parsing" | "chunking" | "multimodal";

type DocumentStageDetailsProps = {
  document: KnowledgeDocument;
  stage: DetailStage;
};

const BLOCK_TYPE_LABELS = {
  heading: "标题",
  paragraph: "段落",
  caption: "图注",
  table: "表格",
};

const MULTIMODAL_TYPE_META = {
  figure: { label: "图片", icon: Image },
  table: { label: "表格", icon: Table2 },
  equation: { label: "公式", icon: Sigma },
};

function InspectorListItem({
  active,
  title,
  meta,
  onClick,
}: {
  active: boolean;
  title: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        width: "100%",
        display: "block",
        textAlign: "left",
        px: 1.5,
        py: 1.25,
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: active ? "rgba(103, 58, 183, 0.08)" : "transparent",
        boxShadow: active ? "inset 3px 0 0 #673ab7" : "none",
        "&:hover": { bgcolor: active ? "rgba(103, 58, 183, 0.1)" : "action.hover" },
        "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -2 },
      }}
    >
      <Typography variant="body2" fontWeight={700} fontFamily="monospace" sx={{ overflowWrap: "anywhere" }}>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary">{meta}</Typography>
    </ButtonBase>
  );
}

function DataSourceBadge() {
  return <Chip label="演示数据" size="small" variant="outlined" color="warning" />;
}

export default function DocumentStageDetails({ document, stage }: DocumentStageDetailsProps) {
  const details = getKnowledgeDocumentDetails(document.name);
  const [parsingIndex, setParsingIndex] = useState(0);
  const [multimodalIndex, setMultimodalIndex] = useState(0);

  if (!details) {
    return <Typography variant="body2" color="text.secondary">当前文档暂无阶段详情。</Typography>;
  }

  if (stage === "parsing") {
    const block = details.parsing.blocks[parsingIndex] ?? details.parsing.blocks[0];

    return (
      <Box>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, mb: 2 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>解析与清洗记录</Typography>
            <Typography variant="caption" color="text.secondary">
              Run {details.parsing.runId} · {details.parsing.blocks.length} 个抽样 Block
            </Typography>
          </Box>
          <DataSourceBadge />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "190px minmax(0, 1fr)" }, border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
          <Box sx={{ borderRight: { md: "1px solid" }, borderBottom: { xs: "1px solid", md: 0 }, borderColor: "divider", bgcolor: "grey.50" }}>
            {details.parsing.blocks.map((item, index) => (
              <InspectorListItem
                key={item.id}
                active={index === parsingIndex}
                title={item.id}
                meta={`Page ${item.page} · ${BLOCK_TYPE_LABELS[item.type]}`}
                onClick={() => setParsingIndex(index)}
              />
            ))}
          </Box>

          {block && (
            <Box sx={{ minWidth: 0, p: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap", mb: 1.5 }}>
                <Chip label={BLOCK_TYPE_LABELS[block.type]} size="small" color="primary" />
                <Chip label={`Page ${block.page}`} size="small" variant="outlined" />
                <Chip label={`bbox [${block.bbox.join(", ")}]`} size="small" variant="outlined" sx={{ fontFamily: "monospace" }} />
                <Chip label={`置信度 ${(block.confidence * 100).toFixed(1)}%`} size="small" color="success" variant="outlined" />
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.25 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">清洗前</Typography>
                  <Paper variant="outlined" sx={{ mt: 0.5, p: 1.5, minHeight: 126, bgcolor: "#fff8f7", borderColor: "rgba(244, 67, 54, 0.24)" }}>
                    <Typography variant="body2" fontFamily="monospace" fontSize={11} whiteSpace="pre-wrap">{block.rawText}</Typography>
                  </Paper>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">清洗后</Typography>
                  <Paper variant="outlined" sx={{ mt: 0.5, p: 1.5, minHeight: 126, bgcolor: "#f6fbf6", borderColor: "rgba(76, 175, 80, 0.28)" }}>
                    <Typography variant="body2" fontFamily="monospace" fontSize={11} whiteSpace="pre-wrap">{block.cleanedText}</Typography>
                  </Paper>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5, mb: 0.75 }}>清洗操作</Typography>
              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                {block.changes.map((change) => <Chip key={change} label={change} size="small" variant="outlined" />)}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  if (stage === "chunking") {
    return <ChunkingWorkbench document={document} chunks={details.chunks} />;
  }

  const asset = details.multimodal[multimodalIndex] ?? details.multimodal[0];
  const assetMeta = asset ? MULTIMODAL_TYPE_META[asset.type] : MULTIMODAL_TYPE_META.figure;
  const AssetIcon = assetMeta.icon;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, mb: 2 }}>
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>多模态对象</Typography>
          <Typography variant="caption" color="text.secondary">图片、表格与公式的页内位置和提取结果</Typography>
        </Box>
        <DataSourceBadge />
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "190px minmax(0, 1fr)" }, border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ borderRight: { md: "1px solid" }, borderBottom: { xs: "1px solid", md: 0 }, borderColor: "divider", bgcolor: "grey.50" }}>
          {details.multimodal.map((item, index) => (
            <InspectorListItem
              key={item.id}
              active={index === multimodalIndex}
              title={item.id}
              meta={`Page ${item.page} · ${MULTIMODAL_TYPE_META[item.type].label}`}
              onClick={() => setMultimodalIndex(index)}
            />
          ))}
        </Box>
        {asset && (
          <Box sx={{ minWidth: 0, p: 2 }}>
            <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
              <Box sx={{ width: 38, height: 38, borderRadius: 1.5, display: "grid", placeItems: "center", bgcolor: "rgba(103, 58, 183, 0.08)", color: "primary.main", flexShrink: 0 }}>
                <AssetIcon size={18} />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" fontWeight={700}>{asset.title}</Typography>
                <Typography variant="caption" color="text.secondary" fontFamily="monospace">{asset.id}</Typography>
              </Box>
              <Chip label={`置信度 ${(asset.confidence * 100).toFixed(1)}%`} size="small" color="success" variant="outlined" />
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1.5 }}>
              <Chip label={assetMeta.label} size="small" color="primary" />
              <Chip label={`Page ${asset.page}`} size="small" variant="outlined" />
              <Chip label={`bbox [${asset.bbox.join(", ")}]`} size="small" variant="outlined" sx={{ fontFamily: "monospace" }} />
            </Box>
            <Typography variant="caption" color="text.secondary">图注 / 标题</Typography>
            <Typography variant="body2" mt={0.5} mb={1.5}>{asset.caption}</Typography>
            <Typography variant="caption" color="text.secondary">提取内容</Typography>
            <Paper variant="outlined" sx={{ mt: 0.5, p: 1.75, bgcolor: "grey.50", minHeight: 110 }}>
              <Typography variant="body2" fontFamily={asset.type === "figure" ? "inherit" : "monospace"} fontSize={12} whiteSpace="pre-wrap" lineHeight={1.7}>
                {asset.extractedContent}
              </Typography>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}
