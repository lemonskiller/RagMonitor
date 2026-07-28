import { useState } from "react";
import {
  Box, Typography, Card, CardContent, Button, Chip, Grid,
  List, ListItemButton, ListItemIcon, ListItemText, Divider,
} from "@mui/material";
import { Play, GitCompareArrows, ChevronDown, ChevronRight } from "lucide-react";

// Pipeline stage definitions
const STAGES = [
  { id: "query", num: "01", name: "User Query", desc: "原始问题", time: "6ms", color: "primary" },
  { id: "intent", num: "02a", name: "Intent Detection", desc: "意图识别 · 路由", time: "14ms", color: "primary" },
  { id: "rewrite", num: "02b", name: "Query Rewrite", desc: "3 queries", time: "68ms", color: "primary" },
  { id: "retrieval", num: "03", name: "Hybrid Retrieval", desc: "44 candidates", time: "148ms", children: [
    { id: "vector", name: "Vector", desc: "20 chunks · 121ms" },
    { id: "bm25", name: "BM25", desc: "20 chunks · 69ms" },
    { id: "sql", name: "SQL", desc: "4 records · 74ms" },
    { id: "graph", name: "Graph", desc: "2 entities · 62ms" },
  ]},
  { id: "fusion", num: "04", name: "Fusion / Dedup", desc: "44→31 · 12ms", time: "12ms", color: "warning" },
  { id: "rerank", num: "05", name: "Rerank", desc: "31→8 · 214ms", time: "214ms", color: "warning" },
  { id: "context", num: "06", name: "Context Builder", desc: "5,840 tokens", time: "4ms", color: "warning" },
  { id: "llm", num: "07", name: "LLM", desc: "gpt-4.1-mini", time: "1.35s", color: "secondary" },
  { id: "output", num: "08", name: "Output Processing", desc: "Parse+Validation+Format", time: "18ms", children: [
    { id: "parser", name: "Output Parser", desc: "JSON · 6ms" },
    { id: "validation", name: "Validation & Citation", desc: "校验 · 8ms" },
    { id: "formatter", name: "Response Formatter", desc: "Markdown · 4ms" },
  ]},
  { id: "answer", num: "09", name: "Final Response", desc: "返回给用户", time: "—", color: "secondary" },
];

const PIPELINE_NODES = [
  { id: "query", label: "User Query", sub: "用户问题", color: "primary.main" },
  { id: "intent", label: "Intent", sub: "意图识别", color: "primary.main" },
  { id: "rewrite", label: "Rewrite", sub: "查询改写", color: "primary.main" },
  { id: "fusion", label: "Fusion/Dedup", sub: "融合·去重", color: "warning.main" },
  { id: "rerank", label: "Rerank", sub: "精排", color: "warning.main" },
  { id: "context", label: "Context", sub: "上下文构建", color: "warning.main" },
  { id: "llm", label: "LLM", sub: "大模型", color: "#e91e63" },
  { id: "answer", label: "Response", sub: "最终响应", color: "#e91e63" },
];

export default function Studio() {
  const [selected, setSelected] = useState("query");
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography variant="h1">RAG Studio</Typography>
          <Typography variant="body2" color="text.secondary">
            检查每个阶段的输入、输出、得分与配置
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" startIcon={<GitCompareArrows size={16} />}>对比版本</Button>
          <Button variant="contained" startIcon={<Play size={16} />}>运行 Case</Button>
        </Box>
      </Box>

      {/* Pipeline DAG */}
      <Card sx={{ mb: 2, overflow: "auto" }}>
        <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 3, minWidth: 900 }}>
          {PIPELINE_NODES.map((node, i) => (
            <Box key={node.id} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                onClick={() => setSelected(node.id)}
                sx={{
                  px: 2, py: 1.5, borderRadius: 2, cursor: "pointer",
                  border: "1px solid", borderColor: selected === node.id ? node.color : "grey.300",
                  borderTop: `3px solid ${node.color}`,
                  bgcolor: selected === node.id ? `${node.color}10` : "#fff",
                  boxShadow: selected === node.id ? `0 6px 24px ${node.color}30` : 0,
                  transform: selected === node.id ? "scale(1.08)" : "scale(1)",
                  transition: "all 180ms cubic-bezier(0.2, 0, 0, 1)",
                  zIndex: selected === node.id ? 2 : 1,
                  minWidth: 72, textAlign: "center",
                }}
              >
                <Typography variant="caption" fontWeight={700}>{node.label}</Typography>
                <Typography variant="caption" display="block" color="text.secondary" fontSize={10}>{node.sub}</Typography>
              </Box>
              {i < PIPELINE_NODES.length - 1 && (
                <Typography color="text.secondary" fontSize={18}>→</Typography>
              )}
            </Box>
          ))}
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {/* Stage List */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="h3" mb={1}>执行阶段</Typography>
              <List dense disablePadding>
                {STAGES.map((stage) => (
                  <Box key={stage.id}>
                    <ListItemButton
                      selected={selected === stage.id}
                      onClick={() => stage.children ? toggleExpand(stage.id) : setSelected(stage.id)}
                      sx={{ borderRadius: 2, mb: 0.25, minHeight: 42 }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Box sx={{
                          width: 26, height: 26, borderRadius: "50%",
                          border: "1px solid", borderColor: "grey.300",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          bgcolor: selected === stage.id ? "primary.main" : "transparent",
                          color: selected === stage.id ? "#fff" : "text.secondary",
                          fontSize: 10, fontWeight: 600,
                        }}>
                          {stage.num || "—"}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={stage.name}
                        secondary={stage.desc}
                        primaryTypographyProps={{ variant: "body2", fontWeight: 600, fontSize: 12 }}
                        secondaryTypographyProps={{ variant: "caption", fontSize: 10 }}
                      />
                      {stage.time && (
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace" fontSize={10}>
                          {stage.time}
                        </Typography>
                      )}
                      {stage.children && (
                        expanded.includes(stage.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                      )}
                    </ListItemButton>
                    {stage.children && expanded.includes(stage.id) && (
                      <Box sx={{ pl: 4 }}>
                        {stage.children.map((child) => (
                          <ListItemButton
                            key={child.id}
                            selected={selected === child.id}
                            onClick={() => setSelected(child.id)}
                            sx={{ borderRadius: 2, minHeight: 36 }}
                          >
                            <ListItemIcon sx={{ minWidth: 24 }}>
                              <Box sx={{
                                width: 20, height: 20, borderRadius: "50%",
                                bgcolor: "grey.100", display: "flex",
                                alignItems: "center", justifyContent: "center",
                                fontSize: 8, color: "text.secondary",
                              }}>—</Box>
                            </ListItemIcon>
                            <ListItemText
                              primary={child.name}
                              secondary={child.desc}
                              primaryTypographyProps={{ variant: "body2", fontSize: 11 }}
                              secondaryTypographyProps={{ variant: "caption", fontSize: 9 }}
                            />
                          </ListItemButton>
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Stage Detail */}
        <Grid item xs={12} md={6}>
          <Card sx={{ minHeight: 400 }}>
            <CardContent>
              <Typography variant="h3" mb={2}>
                {STAGES.find((s) => s.id === selected)?.name || "User Query"}
              </Typography>
              <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, mb: 2 }}>
                <Typography variant="body2">
                  在探究带正电荷的球蛋白发生液-液相分离时，盐浓度如何通过影响 Hofmeister 效应来调控相变温度？
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                选中阶段「{STAGES.find((s) => s.id === selected)?.name || "User Query"}」的详细信息将在此展示。
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Inspector */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h3" mb={2}>配置面板</Typography>
              <Typography variant="body2" color="text.secondary">
                选中阶段的配置参数将在此展示。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
