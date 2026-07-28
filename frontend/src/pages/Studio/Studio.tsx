import { useState } from "react";
import {
  Box, Typography, Card, CardContent, Button, Chip, Grid, Paper,
  List, ListItemButton, ListItemText, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Slider, Switch, Select, MenuItem,
  Divider, IconButton, Tooltip,
} from "@mui/material";
import {
  Play, GitCompareArrows, ChevronDown, ChevronRight,
  Database, Search, Braces, Table2, Image, ChartLine,
  Copy, CheckCircle, AlertTriangle, Info,
} from "lucide-react";

// ── Stage Data ──────────────────────────────────────────
interface StageInfo {
  id: string; num: string; name: string; desc: string; time?: string;
  color?: string; children?: { id: string; name: string; desc: string }[];
  title: string; inspector: string; tag: string; heading: string;
  copy: string; score: string;
}

const stageData: Record<string, StageInfo> = {
  query: { id:"query",num:"01",name:"User Query",desc:"原始问题",time:"6ms",color:"primary.main",
    title:"User Query",inspector:"Query 配置",tag:"Q",heading:"原始问题",
    copy:"在探究带正电荷的球蛋白发生液-液相分离时，盐浓度如何通过影响 Hofmeister 效应来调控相变温度？",
    score:"0.96" },
  intent: { id:"intent",num:"02a",name:"Intent Detection",desc:"意图识别 · 路由",time:"14ms",color:"primary.main",
    title:"Intent Detection",inspector:"意图配置",tag:"INT",heading:"意图识别 · 路由分发 · 14ms",
    copy:"【短期 Memory】最近 3 轮对话 (1,840t) → 话题连续性 cosine 0.87\n【长期 Memory】用户偏好向量 → mechanism_explanation 权重 +0.02\n【结论】综合短期+长期 → 意图 mechanism_explanation (0.96)，匹配规则 #1 → prompt-v12",
    score:"0.96" },
  rewrite: { id:"rewrite",num:"02b",name:"Query Rewrite",desc:"3 queries",time:"68ms",color:"primary.main",
    title:"Query Rewrite",inspector:"改写配置",tag:"3Q",heading:"3 条定向查询 · 68ms",
    copy:"【短期 Memory】{{chat_history}} = Turn1-3 原始 Q&A (1,840t)\n【长期 Memory】{{long_term}} = 2 条摘要 (420t)\n【用户 Profile】{{user_profile}} = 偏好机制解释 · 中文 · 学术场景\n【结果】驱动生成 Q2(低盐机制) + Q3(高盐机制) 两条定向查询",
    score:"0.91" },
  fusion: { id:"fusion",num:"04",name:"Fusion / Dedup",desc:"44→31 · 12ms",time:"12ms",color:"warning.main",
    title:"Fusion / Dedup",inspector:"融合配置",tag:"FUS",heading:"44→31 · 12ms",
    copy:"加权融合 (Vector 0.55 / BM25 0.30 / SQL 0.15 / Graph 0.10) → 去重 (overlap>0.82)。去除 13 条重复 Chunk。",
    score:"12ms" },
  rerank: { id:"rerank",num:"05",name:"Rerank",desc:"31→8 · 214ms",time:"214ms",color:"warning.main",
    title:"Rerank",inspector:"精排配置",tag:"RR",heading:"31→8 · 214ms",
    copy:"bge-reranker-v2-m3 对 31 条候选逐条计算语义相关性。PNAS-2016-E4321/chunk:03 从融合 #3 升至 #1 (0.942)。",
    score:"214ms" },
  context: { id:"context",num:"06",name:"Context Builder",desc:"5,840 tokens",time:"4ms",color:"warning.main",
    title:"Context Builder",inspector:"Context 配置",tag:"CTX",heading:"5,840 tokens · 6 blocks",
    copy:"Top 8 候选合并为 6 个证据段，保留 [source:n] 标识。Token 预算 6,144，占用 95.1%。",
    score:"4ms" },
  llm: { id:"llm",num:"07",name:"LLM",desc:"gpt-4.1-mini",time:"1.35s",color:"#e91e63",
    title:"LLM Generation",inspector:"模型配置",tag:"LLM",heading:"gpt-4.1-mini · 1.35s",
    copy:"Temperature 0.2, max_output 2,048。首 Token 286ms，输出速率 87.3 tok/s。",
    score:"1,142 tok" },
  answer: { id:"answer",num:"09",name:"Final Response",desc:"返回给用户",time:"—",color:"#e91e63",
    title:"Final Response",inspector:"最终结果",tag:"A",heading:"得分 10/10 · 3/3 引用有效",
    copy:"低盐时静电结合导致反向 Hofmeister 序列；高盐时电荷屏蔽使极化率和表面张力占主导，转为正向序列。",
    score:"10/10" },
};
stageData["prompt-builder"] = { id:"prompt-builder",num:"",name:"Prompt Builder",desc:"提示词构建",time:"8ms",
  title:"Prompt Builder",inspector:"Prompt 配置",tag:"PB",heading:"6 组件 · 6,102 tok",
  copy:"Role+Rules+History+Memory+Context+Q+Format",score:"6,102 tok" };

// Retrieval sub-item stage data
stageData["vector-child"] = { id:"vector-child",num:"",name:"Vector Recall",desc:"20 chunks · 121ms",time:"121ms",
  title:"Vector Recall",inspector:"向量配置",tag:"VEC",heading:"bge-m3 / idx-024",
  copy:"Cosine 相似度检索，Top 20 chunks，3 条改写 Query 各自检索。最高分 0.875，最低 0.720。",score:"0.942" };
stageData["bm25"] = { id:"bm25",num:"",name:"BM25 Recall",desc:"20 chunks · 69ms",time:"69ms",
  title:"BM25 Recall",inspector:"BM25 配置",tag:"BM25",heading:"关键词命中 · 最高 21.78",
  copy:"关键词 Hofmeister、lysozyme、charge screening 在标题和摘要中高频命中。Analyzer: biomed_zh_en。",score:"18.42" };
stageData["sql"] = { id:"sql",num:"",name:"SQL Recall",desc:"4 records · 74ms",time:"74ms",
  title:"SQL Recall",inspector:"SQL 配置",tag:"SQL",heading:"phase_transition_records",
  copy:"SELECT * FROM phase_transition_records WHERE protein='lysozyme' AND phenomenon='LLPS'。命中 4 条实验记录。",score:"4 rows" };
stageData["graph"] = { id:"graph",num:"",name:"Graph / API Recall",desc:"2 entities · 62ms",time:"62ms",
  title:"Graph / API Recall",inspector:"Graph 配置",tag:"GPH",heading:"知识图谱实体查询",
  copy:"查询 lysozyme → LLPS → Hofmeister series 关系链，返回 2 个实体节点及其属性。",score:"2 entities" };

const RETRIEVAL_CHILDREN = [
  { id: "vector-child", name: "Vector", desc: "20 chunks · 121ms" },
  { id: "bm25", name: "BM25", desc: "20 chunks · 69ms" },
  { id: "sql", name: "SQL", desc: "4 records · 74ms" },
  { id: "graph", name: "Graph", desc: "2 entities · 62ms" },
];
const OUTPUT_CHILDREN = [
  { id: "output-parser", name: "Output Parser", desc: "JSON · 6ms" },
  { id: "validation", name: "Validation & Citation", desc: "校验 · 8ms" },
  { id: "formatter", name: "Response Formatter", desc: "Markdown · 4ms" },
];

// ── Pipeline DAG Nodes ──────────────────────────────────
const PIPELINE_NODES: { id: string; label: string; sub: string; color: string; width?: number }[] = [
  { id:"query", label:"User Query", sub:"用户问题", color:"primary.main", width:80 },
  { id:"intent", label:"Intent", sub:"意图识别", color:"primary.main", width:72 },
  { id:"rewrite", label:"Rewrite", sub:"查询改写", color:"primary.main", width:72 },
  { id:"retrieval", label:"Hybrid Retrieval", sub:"混合召回", color:"#00897b", width:140 },
  { id:"fusion", label:"Fusion/Dedup", sub:"融合·去重", color:"warning.main", width:80 },
  { id:"rerank", label:"Rerank", sub:"精排", color:"warning.main", width:64 },
  { id:"context", label:"Context", sub:"上下文构建", color:"warning.main", width:72 },
  { id:"llm", label:"LLM", sub:"大模型", color:"#e91e63", width:56 },
  { id:"output", label:"Output Proc", sub:"后处理", color:"warning.main", width:80 },
  { id:"answer", label:"Response", sub:"最终响应", color:"#e91e63", width:72 },
];

// ── Component ───────────────────────────────────────────
export default function Studio() {
  const [selected, setSelected] = useState("query");
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggleExpand = (id: string) =>
    setExpanded((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const current = stageData[selected] || stageData.query;
  const isRetrievalParent = selected === "retrieval";
  const isOutputParent = selected === "output";

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2.5 }}>
        <Box>
          <Typography variant="h1">RAG Studio</Typography>
          <Typography variant="body2" color="text.secondary">
            检查每个阶段的输入、输出、得分与配置
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<GitCompareArrows size={15} />}>对比版本</Button>
          <Button variant="contained" size="small" startIcon={<Play size={15} />}>运行 Case</Button>
        </Box>
      </Box>

      {/* ── Pipeline DAG ── */}
      <Card sx={{ mb: 2, overflow: "auto" }}>
        <CardContent sx={{ py: 2.5, minWidth: 950 }}>
          {/* Row 1: Query → Intent | Rewrite → Retrieval */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <PipeNode node={PIPELINE_NODES[0]} selected={selected} onClick={setSelected} />
            <Arrow />
            {/* Intent + Rewrite parallel */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <PipeNode node={PIPELINE_NODES[1]} selected={selected} onClick={setSelected} size="sm" />
              <Typography variant="caption" color="text.secondary" textAlign="center" fontSize={9}>↕ 并行</Typography>
              <PipeNode node={PIPELINE_NODES[2]} selected={selected} onClick={setSelected} size="sm" />
            </Box>
            <Arrow />
            <Box
              onClick={() => { setSelected("retrieval"); toggleExpand("retrieval"); }}
              sx={{
                border:"2px solid",borderColor:selected==="retrieval"||RETRIEVAL_CHILDREN.some(c=>c.id===selected)?"#00897b":"#b2dfdb",
                borderRadius:2,bgcolor:"#e0f2f1",px:1.5,py:1,cursor:"pointer",
                boxShadow:selected==="retrieval"?"0 0 0 3px rgba(0,137,123,0.15)":0,
              }}
            >
              <Typography variant="caption" fontWeight={700} color="#00695c" fontSize={9}>Hybrid Retrieval 混合召回</Typography>
              <Box sx={{ display: "flex", gap: 0.5, mt: 0.5 }}>
                {RETRIEVAL_CHILDREN.map((c) => (
                  <Box key={c.id} onClick={(e) => { e.stopPropagation(); setSelected(c.id); }}
                    sx={{ px:1,py:0.5,borderRadius:1,border:"1px solid",borderColor:selected===c.id?"#00897b":"#b2dfdb",
                      bgcolor:selected===c.id?"#b9e4de":"#fff",cursor:"pointer",textAlign:"center",minWidth:52 }}>
                    <Typography variant="caption" fontWeight={700} fontSize={9}>{c.name}</Typography>
                    <Typography variant="caption" display="block" color="text.secondary" fontSize={7}>{c.desc.split("·")[0]}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
          {/* Down arrows */}
          <Box sx={{ textAlign: "center", my: 0.5, ml: 15 }}>
            <Typography color="text.secondary" fontSize={14}>↓</Typography>
          </Box>
          {/* Row 2: Fusion → Rerank → Context → LLM → Output → Response */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {PIPELINE_NODES.slice(4).map((node) => (
              <Box key={node.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {node.id === "output" ? (
                  <Box onClick={() => { setSelected("output"); toggleExpand("output"); }}
                    sx={{ px:1.5,py:1,borderRadius:1.5,border:"1px solid",borderColor:selected==="output"||OUTPUT_CHILDREN.some(c=>c.id===selected)?"warning.main":"grey.300",
                      borderTop:`3px solid`,borderTopColor:"warning.main",bgcolor:"#fff",cursor:"pointer",minWidth:80 }}>
                    <Typography variant="caption" fontWeight={700}>Output Proc</Typography>
                    <Typography variant="caption" display="block" color="text.secondary" fontSize={8}>解析·校验·格式化</Typography>
                  </Box>
                ) : (
                  <PipeNode node={node} selected={selected} onClick={setSelected} size={node.id==="llm"||node.id==="answer"?"sm":undefined} />
                )}
                {node.id !== "answer" && <Arrow />}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* ── Three-Column Layout ── */}
      <Grid container spacing={2}>
        {/* Left: Stage List */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ py: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>执行阶段</Typography>
              <List dense disablePadding>
                {[
                  { id:"query",num:"01",name:"User Query",desc:"原始问题",time:"6ms" },
                  { id:"intent",num:"02a",name:"Intent Detection",desc:"意图识别 · 路由",time:"14ms" },
                  { id:"rewrite",num:"02b",name:"Query Rewrite",desc:"3 queries",time:"68ms" },
                  { id:"retrieval",num:"03",name:"Hybrid Retrieval",desc:"44 candidates",time:"148ms",children:RETRIEVAL_CHILDREN },
                  { id:"fusion",num:"04",name:"Fusion / Dedup",desc:"44→31 · 12ms",time:"12ms" },
                  { id:"rerank",num:"05",name:"Rerank",desc:"31→8 · 214ms",time:"214ms" },
                  { id:"context",num:"06",name:"Context Builder",desc:"5,840 tokens",time:"4ms" },
                  { id:"llm",num:"07",name:"LLM",desc:"gpt-4.1-mini",time:"1.35s" },
                  { id:"output",num:"08",name:"Output Processing",desc:"Parse+Validation+Format",time:"18ms",children:OUTPUT_CHILDREN },
                  { id:"answer",num:"09",name:"Final Response",desc:"返回给用户",time:"—" },
                ].map((s: any) => (
                  <Box key={s.id}>
                    <ListItemButton
                      selected={selected === s.id}
                      onClick={() => s.children ? toggleExpand(s.id) : setSelected(s.id)}
                      sx={{ borderRadius: 2, mb: 0.25, minHeight: 40, px: 1 }}
                    >
                      <Box sx={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid", borderColor: "grey.300",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        bgcolor: selected === s.id ? "primary.main" : "transparent",
                        color: selected === s.id ? "#fff" : "text.secondary", fontSize: 10, fontWeight: 700, mr: 1, flexShrink: 0 }}>
                        {s.num}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} fontSize={11}>{s.name}</Typography>
                        <Typography variant="caption" color="text.secondary" fontSize={9}>{s.desc}</Typography>
                      </Box>
                      {s.time && <Typography variant="caption" color="text.secondary" fontFamily="monospace" fontSize={9}>{s.time}</Typography>}
                      {s.children && (expanded.includes(s.id) ? <ChevronDown size={12} /> : <ChevronRight size={12} />)}
                    </ListItemButton>
                    {s.children && expanded.includes(s.id) && (
                      <Box sx={{ pl: 4 }}>
                        {s.children.map((c: any) => (
                          <ListItemButton key={c.id} selected={selected === c.id} onClick={() => setSelected(c.id)}
                            sx={{ borderRadius: 2, minHeight: 32, px: 1 }}>
                            <Box sx={{ width: 18, height: 18, borderRadius: "50%", bgcolor: "grey.100", display: "flex",
                              alignItems: "center", justifyContent: "center", fontSize: 7, color: "text.secondary", mr: 1 }}>─</Box>
                            <ListItemText primary={c.name} secondary={c.desc}
                              primaryTypographyProps={{ variant: "body2", fontSize: 10, fontWeight: 500 }}
                              secondaryTypographyProps={{ variant: "caption", fontSize: 8 }} />
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

        {/* Center: Stage Content */}
        <Grid item xs={12} md={6}>
          <Card sx={{ minHeight: 420 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h3">{current.title}</Typography>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Chip label="Candidate" color="primary" size="small" />
                  <Chip label="Baseline" variant="outlined" size="small" />
                </Box>
              </Box>

              {selected === "fusion" ? (
                <Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1.5, mb: 2 }}>
                    {[{ v:"44",l:"融合输入" },{ v:"13",l:"重复 Chunk" },{ v:"31",l:"输出" }].map((d,i) => (
                      <Paper key={i} sx={{ p: 1.5, textAlign: "center", bgcolor: "grey.50" }}>
                        <Typography variant="h5" fontWeight={600}>{d.v}</Typography>
                        <Typography variant="caption" color="text.secondary">{d.l}</Typography>
                      </Paper>
                    ))}
                  </Box>
                  <Table size="small">
                    <TableHead><TableRow>
                      {["重复对","文档","重叠度","操作"].map(h=><TableCell key={h} sx={{fontSize:11}}>{h}</TableCell>)}
                    </TableRow></TableHead>
                    <TableBody>
                      {[["chunk:08↔08b","HOF-LLPS-014","0.94","已合并"],["chunk:0128↔0128b","LLPS_review","0.92","已合并"],
                        ["chunk:03↔03a","PNAS-2016","0.89","已合并"]].map((r,i)=>(
                        <TableRow key={i}><TableCell sx={{fontSize:11}}>{r[0]}</TableCell><TableCell sx={{fontSize:11}}>{r[1]}</TableCell>
                          <TableCell sx={{fontSize:11,fontWeight:700,color:Number(r[2])>0.9?"error.main":"warning.main"}}>{r[2]}</TableCell>
                          <TableCell><Chip label={r[3]} color="success" size="small" /></TableCell></TableRow>
                      ))}</TableBody></Table>
                </Box>
              ) : selected === "rerank" ? (
                <Box>
                  <Paper sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid", borderColor: "grey.200", borderLeft: "4px solid", borderLeftColor: "primary.main", mb: 2 }}>
                    <Typography variant="body2" fontWeight={700} fontFamily="monospace" fontSize={12}>
                      S(d) = 0.55 × Vₙ(d) + 0.30 × Bₙ(d) + 0.15 × SQL(d) + 0.10 × G(d)
                    </Typography>
                  </Paper>
                  <Table size="small">
                    <TableHead><TableRow>{["Chunk","融合排名","Rerank","最终","变化"].map(h=><TableCell key={h} sx={{fontSize:10}}>{h}</TableCell>)}</TableRow></TableHead>
                    <TableBody>{[
                      ["PNAS-2016 / 03","#3","0.942","#1","↑2","success"],
                      ["HOF-LLPS-014 / 08","#1","0.901","#2","↓1","error"],
                      ["PHASE-REVIEW / 17","#7","0.876","#3","↑4","success"],
                    ].map((r,i)=>(
                      <TableRow key={i}><TableCell sx={{fontSize:10,fontWeight:600}}>{r[0]}</TableCell>
                        <TableCell sx={{fontSize:10,fontFamily:"monospace"}}>{r[1]}</TableCell>
                        <TableCell sx={{fontSize:10,fontFamily:"monospace",color:"success.main",fontWeight:700}}>{r[2]}</TableCell>
                        <TableCell sx={{fontSize:10,fontFamily:"monospace"}}>{r[3]}</TableCell>
                        <TableCell sx={{fontSize:10,color:r[5]==="success"?"success.main":"error.main",fontWeight:700}}>{r[4]}</TableCell></TableRow>
                    ))}</TableBody></Table>
                </Box>
              ) : (
                <Box>
                  <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, mb: 2, whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 12, lineHeight: 1.7, color: "text.secondary" }}>
                    {current.copy}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, p: 1.5, bgcolor: "grey.50", borderRadius: 2 }}>
                    <Chip label={current.tag} size="small" color="primary" />
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{current.heading}</Typography>
                      <Typography variant="body2" color="text.secondary" mt={0.5}>{current.copy}</Typography>
                      <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                        candidate-v2 · {selected}
                      </Typography>
                    </Box>
                    <Box sx={{ ml: "auto", textAlign: "right" }}>
                      <Typography variant="body2" fontWeight={700} fontFamily="monospace">{current.score}</Typography>
                      <Typography variant="caption" color="text.secondary">score</Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Inspector */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ py: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={600}>{current.inspector}</Typography>
                <IconButton size="small"><Copy size={14} /></IconButton>
              </Box>
              <Divider sx={{ mb: 1.5 }} />
              {selected === "intent" ? (
                <Box>
                  {[["识别模型","intent-classifier-v3"],["Top-1 意图","mechanism_explanation"],
                    ["置信度","0.96"],["→ 路由 Prompt","prompt-v12"]].map((r,i)=>(
                    <Box key={i} sx={{ display: "flex", justifyContent: "space-between", py: 0.8, borderBottom: "1px solid", borderColor: "divider" }}>
                      <Typography variant="caption" color="text.secondary">{r[0]}</Typography>
                      <Typography variant="caption" fontWeight={600} fontFamily="monospace">{r[1]}</Typography>
                    </Box>
                  ))}
                  <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>Memory 输入</Typography>
                    {[["短期","话题连续性","cosine 0.87"],["短期","最近聊天","3轮·1,840t"],["长期","用户偏好","68% 机制类"]].map((r,i)=>(
                      <Box key={i} sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                        <Chip label={r[0]} size="small" color={r[0]==="短期"?"primary":"warning"} sx={{ height: 18, fontSize: 9 }} />
                        <Typography variant="caption" color="text.secondary" fontSize={10}>{r[1]}</Typography>
                        <Typography variant="caption" fontWeight={600} fontSize={10}>{r[2]}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : selected === "rerank" ? (
                <Box>
                  {[["Rerank 模型","bge-reranker-v2-m3"],["输入","31 → Top 8"],["最高分","0.942"],["排名变化","3↑·2↓"]].map((r,i)=>(
                    <Box key={i} sx={{ display: "flex", justifyContent: "space-between", py: 0.8, borderBottom: "1px solid", borderColor: "divider" }}>
                      <Typography variant="caption" color="text.secondary">{r[0]}</Typography>
                      <Typography variant="caption" fontWeight={600} fontFamily="monospace">{r[1]}</Typography>
                    </Box>
                  ))}
                  <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>融合权重</Typography>
                    {[["Vector","0.55"],["BM25","0.30"],["SQL","0.15"],["Graph","0.10"]].map((r,i)=>(
                      <Box key={i} sx={{ display: "flex", justifyContent: "space-between", py: 0.3 }}>
                        <Typography variant="caption" fontSize={10}>{r[0]}</Typography>
                        <Typography variant="caption" fontWeight={600} fontFamily="monospace" fontSize={10}>{r[1]}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (selected === "retrieval" || selected === "vector-child") ? (
                <Box>
                  {[["Embedding","bge-m3 / 1024d"],["Top-K","20"],["相似度阈值","0.72"],["最高 Cosine","0.875"],["最低 Cosine","0.720"]].map((r,i)=>(
                    <Box key={i} sx={{ display:"flex",justifyContent:"space-between",py:0.8,borderBottom:"1px solid",borderColor:"divider" }}>
                      <Typography variant="caption" color="text.secondary">{r[0]}</Typography>
                      <Typography variant="caption" fontWeight={600} fontFamily="monospace">{r[1]}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : (selected === "bm25") ? (
                <Box>
                  {[["Analyzer","biomed_zh_en"],["Top-K","20"],["最高 BM25","21.78"],["命中关键词","Hofmeister,lysozyme,charge"],["耗时","69ms"]].map((r,i)=>(
                    <Box key={i} sx={{ display:"flex",justifyContent:"space-between",py:0.8,borderBottom:"1px solid",borderColor:"divider" }}>
                      <Typography variant="caption" color="text.secondary">{r[0]}</Typography>
                      <Typography variant="caption" fontWeight={600} fontFamily="monospace">{r[1]}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : (selected === "sql") ? (
                <Box>
                  <Box sx={{ p:1.5,bgcolor:"#1e1e1e",borderRadius:2,mb:1.5,fontFamily:"monospace",fontSize:10,color:"#e8eaed",lineHeight:1.8 }}>
                    SELECT salt_type, concentration,<br/>transition_temp, source_id<br/>
                    FROM phase_transition_records<br/>
                    WHERE protein = <span style={{color:"#64b5f6"}}>'lysozyme'</span><br/>
                    &nbsp;&nbsp;AND phenomenon = <span style={{color:"#64b5f6"}}>'LLPS'</span><br/>
                    ORDER BY concentration ASC<br/>LIMIT 20;
                  </Box>
                  {[["耗时","74ms"],["命中行数","4 records"],["数据源","phase_prod.transition_records"],["索引命中","idx_protein_phenomenon"]].map((r,i)=>(
                    <Box key={i} sx={{ display:"flex",justifyContent:"space-between",py:0.8,borderBottom:"1px solid",borderColor:"divider" }}>
                      <Typography variant="caption" color="text.secondary">{r[0]}</Typography>
                      <Typography variant="caption" fontWeight={600} fontFamily="monospace">{r[1]}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : (selected === "graph") ? (
                <Box>
                  {[["查询类型","知识图谱实体"],["实体","lysozyme → LLPS → Hofmeister"],["返回节点","2 entities"],["关系边","3 edges"],["耗时","62ms"]].map((r,i)=>(
                    <Box key={i} sx={{ display:"flex",justifyContent:"space-between",py:0.8,borderBottom:"1px solid",borderColor:"divider" }}>
                      <Typography variant="caption" color="text.secondary">{r[0]}</Typography>
                      <Typography variant="caption" fontWeight={600} fontFamily="monospace">{r[1]}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box>
                  {[["Top-K","20"],["相似度阈值","0.72"],["召回模型","bge-m3"]].map((r,i)=>(
                    <Box key={i} sx={{ display:"flex",justifyContent:"space-between",py:0.8,borderBottom:"1px solid",borderColor:"divider" }}>
                      <Typography variant="caption" color="text.secondary">{r[0]}</Typography>
                      <Typography variant="caption" fontWeight={600} fontFamily="monospace">{r[1]}</Typography>
                    </Box>
                  ))}
                  {[["Vector 权重","0.55"],["BM25 权重","0.30"],["SQL 权重","0.15"]].map((r,i)=>(
                    <Box key={i} sx={{ display:"flex",justifyContent:"space-between",py:0.8 }}>
                      <Typography variant="caption" color="text.secondary">{r[0]}</Typography>
                      <Box sx={{ display:"flex",alignItems:"center",gap:1 }}>
                        <Typography variant="caption" fontWeight={600} fontFamily="monospace">{r[1]}</Typography>
                        <Switch size="small" defaultChecked />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// ── Sub-components ──────────────────────────────────────
function PipeNode({ node, selected, onClick, size }: {
  node: { id: string; label: string; sub: string; color: string };
  selected: string; onClick: (id: string) => void; size?: "sm";
}) {
  const active = selected === node.id;
  return (
    <Box
      onClick={() => onClick(node.id)}
      sx={{
        px: size === "sm" ? 1 : 1.5, py: size === "sm" ? 0.8 : 1,
        borderRadius: 2, cursor: "pointer", textAlign: "center",
        border: "1px solid", borderColor: active ? node.color : "grey.300",
        borderTop: `3px solid ${node.color}`,
        bgcolor: active ? `${node.color}10` : "#fff",
        boxShadow: active ? `0 6px 24px ${node.color}30, 0 0 0 3px ${node.color}20` : 0,
        transform: active ? "scale(1.08)" : "scale(1)",
        transition: "all 180ms cubic-bezier(0.2,0,0,1)",
        zIndex: active ? 2 : 1, position: "relative",
        minWidth: size === "sm" ? 52 : 72,
      }}
    >
      <Typography variant="caption" fontWeight={700} fontSize={size === "sm" ? 9 : 10}>{node.label}</Typography>
      <Typography variant="caption" display="block" color="text.secondary" fontSize={size === "sm" ? 7 : 8}>{node.sub}</Typography>
    </Box>
  );
}

function Arrow() {
  return <Typography color="text.secondary" fontSize={18} sx={{ flexShrink: 0 }}>→</Typography>;
}
