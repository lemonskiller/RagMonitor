import { useMemo, useState } from "react";
import { Box, ButtonBase, Chip, Divider, Paper, Tooltip, Typography } from "@mui/material";
import { Database, FileText, Info, Sigma, Table2, WandSparkles } from "lucide-react";
import ChunkingWorkbench from "./ChunkingWorkbench";
import { buildChunksFromSampleRecords } from "./Knowledge.data";
import type { KnowledgeDocument, KnowledgeSampleRecord } from "./Knowledge.data";

type DetailStage = "overview" | "records" | "chunking" | "raw";

type DocumentStageDetailsProps = {
  document: KnowledgeDocument;
  stage: DetailStage;
};

const STAGE_LABELS: Record<DetailStage, string> = {
  overview: "数据源概览",
  records: "抽样记录",
  chunking: "分块与索引",
  raw: "原始 JSON",
};

const TYPE_LABELS = {
  heading: "标题",
  paragraph: "段落",
  caption: "说明",
  table: "表格",
};

const ROW_FIELDS: Array<[keyof KnowledgeSampleRecord, string]> = [
  ["record_id", "record_id"],
  ["source_database", "source_database"],
  ["source_file", "source_file"],
  ["entity_type", "entity_type"],
  ["primary_name", "primary_name"],
  ["gene_name", "gene_name"],
  ["organism", "organism"],
  ["evidence_class", "evidence_class"],
  ["evidence_detail", "evidence_detail"],
];

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
      <Typography variant="caption" color="text.secondary">
        {meta}
      </Typography>
    </ButtonBase>
  );
}

function DataSourceBadge() {
  return <Chip label="真实后端" size="small" variant="outlined" color="success" />;
}

function valueOrDash(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

export default function DocumentStageDetails({ document, stage }: DocumentStageDetailsProps) {
  const records = document.sampleRecords ?? [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedRecord = records[selectedIndex] ?? records[0];
  const chunkRecords = useMemo(() => buildChunksFromSampleRecords(records, document.recordCount ?? records.length), [document.recordCount, records]);

  if (stage === "overview") {
    const fields = [
      ["源数据库", document.sourceDatabase || document.source],
      ["标题", document.title || document.name],
      ["类别", document.category || "-"],
      ["默认实体类型", document.defaultEntityType || "-"],
      ["证据等级", document.evidenceClass || document.duplicateStatus],
      ["Parser", document.parserVersion || document.parser],
      ["Homepage", document.homepage || "-"],
      ["License", document.license || "-"],
      ["记录数", Number(document.recordCount ?? document.chunks ?? 0).toLocaleString()],
      ["源文件数", String(document.sourceFileCount ?? "-")],
      ["Snapshot", document.snapshotRelease || document.updatedAt],
      ["说明", document.description || "-"],
    ] as const;

    return (
      <Box>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, mb: 2 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              数据源概览
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {document.sourceDatabase || document.name} · {records.length} 条抽样记录
            </Typography>
          </Box>
          <DataSourceBadge />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {fields.map(([label, value], index) => (
            <Box
              key={label}
              sx={{
                minWidth: 0,
                px: 2,
                py: 1.75,
                borderRight: { sm: index % 2 === 0 ? "1px solid" : 0 },
                borderBottom: { xs: index < fields.length - 1 ? "1px solid" : 0, sm: index < fields.length - 2 ? "1px solid" : 0 },
                borderColor: "divider",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="body2" fontWeight={700} mt={0.5} sx={{ overflowWrap: "anywhere" }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  if (stage === "records") {
    if (records.length === 0) {
      return <Typography variant="body2" color="text.secondary">当前数据源没有抽样记录。</Typography>;
    }

    return (
      <Box>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, mb: 2 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                抽样记录
              </Typography>
              <Tooltip title="左侧展示的是 records 表里的抽样字段摘要，不是 raw_json 的原始键值对；右侧卡片是同一条记录的结构化字段。">
                <Box sx={{ display: "inline-flex", color: "text.secondary" }}>
                  <Info size={14} />
                </Box>
              </Tooltip>
            </Box>
            <Typography variant="caption" color="text.secondary">
              从真实 `records` 表抽样展示
            </Typography>
          </Box>
          <DataSourceBadge />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "190px minmax(0, 1fr)" },
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Box sx={{ borderRight: { md: "1px solid" }, borderBottom: { xs: "1px solid", md: 0 }, borderColor: "divider", bgcolor: "grey.50" }}>
            {records.map((item, index) => (
              <InspectorListItem
                key={item.record_id}
                active={index === selectedIndex}
                title={item.record_id}
                meta={`${item.entity_type || "-"} · ${item.primary_name || item.gene_name || "unknown"}`}
                onClick={() => setSelectedIndex(index)}
              />
            ))}
          </Box>

          {selectedRecord && (
            <Box sx={{ minWidth: 0, p: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap", mb: 1.5 }}>
                <Chip label={valueOrDash(selectedRecord.entity_type)} size="small" color="primary" />
                <Chip label={valueOrDash(selectedRecord.evidence_class)} size="small" variant="outlined" />
                <Chip label={valueOrDash(selectedRecord.organism)} size="small" variant="outlined" />
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.25 }}>
                {ROW_FIELDS.map(([field, label]) => (
                  <Box key={label}>
                    <Typography variant="caption" color="text.secondary">
                      {label}
                    </Typography>
                    <Paper variant="outlined" sx={{ mt: 0.5, p: 1.25, minHeight: 56, bgcolor: "grey.50" }}>
                      <Typography variant="body2" fontFamily="monospace" fontSize={11} sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                        {valueOrDash(selectedRecord[field])}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5, mb: 0.75 }}>
                描述
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "grey.50" }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.75 }}>
                  {valueOrDash(selectedRecord.description)}
                </Typography>
              </Paper>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  if (stage === "chunking") {
    return <ChunkingWorkbench document={document} chunks={chunkRecords} />;
  }

  const record = selectedRecord || records[0];

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, mb: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              原始 JSON
            </Typography>
            <Tooltip title="这里是同一条抽样记录的原始 payload，通常比左侧字段摘要更长；左侧展示的是结构化字段，便于快速查看。">
              <Box sx={{ display: "inline-flex", color: "text.secondary" }}>
                <Info size={14} />
              </Box>
            </Tooltip>
          </Box>
          <Typography variant="caption" color="text.secondary">
            抽样记录的完整原始字段
          </Typography>
        </Box>
        <DataSourceBadge />
      </Box>
      {!record ? (
        <Typography variant="body2" color="text.secondary">当前数据源没有可展示的原始记录。</Typography>
      ) : (
        <Box>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1.25 }}>
            <Chip icon={<Database size={13} />} label={record.source_database} size="small" />
            <Chip icon={<FileText size={13} />} label={record.record_id} size="small" variant="outlined" />
            <Chip icon={<WandSparkles size={13} />} label={record.evidence_class || "-"} size="small" variant="outlined" />
            <Chip icon={<Table2 size={13} />} label={`schema v${record.schema_version}`} size="small" variant="outlined" />
            <Chip icon={<Sigma size={13} />} label={record.entity_type || "-"} size="small" variant="outlined" />
          </Box>
          <Paper variant="outlined" sx={{ p: 1.75, bgcolor: "grey.50", minHeight: 220 }}>
            <Typography
              component="pre"
              variant="body2"
              fontFamily="monospace"
              fontSize={11}
              whiteSpace="pre-wrap"
              sx={{ m: 0, overflowWrap: "anywhere" }}
            >
              {record.raw_json}
            </Typography>
          </Paper>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" color="text.secondary">
            condensed fields
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
            {valueOrDash(record.description)}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
