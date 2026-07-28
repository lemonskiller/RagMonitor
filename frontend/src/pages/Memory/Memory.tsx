import { Box, Typography, Card, CardContent, Button, Chip, Grid, Table, TableBody,
  TableCell, TableHead, TableRow, Paper, LinearProgress } from "@mui/material";
import { Download, Plus, BrainCircuit, Database, CheckCircle, AlertTriangle, Info } from "lucide-react";

const METRICS = [
  { label:"活跃 Session", value:"1,284", sub:"平均 4.2 轮 · 自动回写", color:"success.main" },
  { label:"路由规则", value:"15", sub:"覆盖 12 种意图 · 20 个 Prompt" },
  { label:"Memory 命中率", value:"87.3%", sub:"改写覆盖率 +18.4%", color:"success.main" },
  { label:"今日回写", value:"8,420", sub:"异步 · 零丢失" },
];

const SHORT_TERM = [
  { label:"存储引擎", value:"Redis Cluster" },
  { label:"过期策略", value:"30min TTL · 每轮刷新" },
  { label:"最大轮数", value:"20 轮 / Session" },
  { label:"存储内容", value:"Query · Answer · Evidence · Feedback" },
  { label:"当前用量", value:"342 sessions · 1.2 GB" },
  { label:"触发截断", value:"> 4,096 tokens 时压缩旧轮次" },
];

const LONG_TERM = [
  { label:"存储引擎", value:"Milvus · idx-mem-003" },
  { label:"Embedding", value:"bge-m3 · 1024d" },
  { label:"压缩策略", value:"LLM 摘要 · 关键实体提取" },
  { label:"向量条目", value:"48,266 条" },
  { label:"摘要压缩率", value:"86.4%" },
  { label:"检索方式", value:"user_id + 话题向量相似度" },
];

const RULES = [
  { pri:"#1", name:"生物机制解释", intent:"mechanism_explanation", prompt:"prompt-v12", mem:"短期", memType:"primary" as const, hit:"92.4%" },
  { pri:"#2", name:"单库精查", intent:"single_fact_lookup", prompt:"prompt-v11", mem:"短期", memType:"primary" as const, hit:"88.1%" },
  { pri:"#3", name:"跨库综合分析", intent:"cross_reference", prompt:"prompt-v12", mem:"长期", memType:"warning" as const, hit:"85.7%" },
  { pri:"#4", name:"文献综述总结", intent:"summarization", prompt:"prompt-v15", mem:"长期", memType:"warning" as const, hit:"82.4%" },
  { pri:"#5", name:"实验方法指导", intent:"methodology", prompt:"prompt-v17", mem:"长期", memType:"warning" as const, hit:"90.8%" },
  { pri:"#6", name:"假设验证", intent:"hypothesis_test", prompt:"prompt-v18", mem:"长期", memType:"warning" as const, hit:"81.2%" },
  { pri:"#7", name:"数据分析计算", intent:"data_analysis", prompt:"prompt-v14", mem:"短期", memType:"primary" as const, hit:"89.6%" },
  { pri:"#8", name:"对比分析", intent:"comparison", prompt:"prompt-v16", mem:"短期", memType:"primary" as const, hit:"87.9%" },
  { pri:"#9", name:"证据引用验证", intent:"citation_required", prompt:"prompt-v10", mem:"短期", memType:"primary" as const, hit:"84.2%" },
  { pri:"#10", name:"图表解读", intent:"chart_interpret", prompt:"prompt-v19", mem:"短期", memType:"primary" as const, hit:"86.5%" },
];

const TRAFFIC = [
  { name:"机制解释", prompt:"prompt-v12", count:"3,201 次", pct:"38%", hit:"92.4% 命中", color:"primary.main", width:"38%" },
  { name:"事实查询", prompt:"prompt-v11", count:"2,189 次", pct:"26%", hit:"88.1% 命中", color:"#00897b", width:"26%" },
  { name:"跨库综合", prompt:"prompt-v12", count:"1,516 次", pct:"18%", hit:"85.7% 命中", color:"warning.main", width:"18%" },
  { name:"通用问答", prompt:"prompt-v9", count:"1,010 次", pct:"12%", hit:"91.8% 命中", color:"success.main", width:"12%" },
  { name:"证据引用", prompt:"prompt-v10", count:"504 次", pct:"6%", hit:"84.2% 命中", color:"error.main", width:"6%" },
];

const TURNS = [
  { badge:"Turn 1", badgeColor:"info" as const, q:"盐浓度如何通过 Hofmeister 效应调控相变温度？", route:"→ prompt-v12",
    detail:"Memory 检索（新 Session 无历史）→ 改写（通用）→ 召回→排序→生成 → 自动回写：短期追加 Turn1 至 Redis，长期异步提取 \"Hofmeister·lysozyme·SCN⁻\" 实体写入向量库。" },
  { badge:"Turn 2", badgeColor:"info" as const, q:"低盐和高盐阶段的主导机制分别是什么？", route:"→ prompt-v12",
    detail:"Memory 命中 Turn1 (cosine 0.87) → 注入 chat_history → 改写模型检测到\"低盐/高盐\"两个子话题 → 生成 2 条定向改写 → 召回命中率 +12% → 自动回写追加 Turn2。" },
  { badge:"Turn 3", badgeColor:"warning" as const, q:"Nup116 是否有朊病毒样结构域？", route:"→ prompt-v11",
    detail:"话题偏离 (cosine 0.31) → 意图切换为 single_fact_lookup → 路由至 prompt-v11 → 旧对话压缩为 86 tokens 摘要 → 自动回写：短期新话题段，长期固化旧结论。" },
];

export default function Memory() {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", mb:2.5 }}>
        <Box>
          <Typography variant="h1">Memory 管理</Typography>
          <Typography variant="body2" color="text.secondary">自动记忆管理 · 智能路由分发 · 长短周期策略</Typography>
        </Box>
        <Box sx={{ display:"flex", gap:1 }}>
          <Button variant="outlined" size="small" startIcon={<Download size={14} />}>导出配置</Button>
          <Button variant="contained" size="small" startIcon={<Plus size={14} />}>新建路由规则</Button>
        </Box>
      </Box>

      {/* Metric Cards */}
      <Grid container spacing={2} sx={{ mb:2.5 }}>
        {METRICS.map((m) => (
          <Grid item xs={6} sm={3} key={m.label}>
            <Card><CardContent sx={{ py:2.5, px:3 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>{m.label}</Typography>
              <Typography variant="h5" fontWeight={600} mt={1} color={m.color}>{m.value}</Typography>
              <Typography variant="caption" color="text.secondary" mt={0.5}>{m.sub}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      {/* Short / Long Term Memory */}
      <Grid container spacing={2} sx={{ mb:2.5 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display:"flex", alignItems:"center", gap:1, mb:2 }}>
                <Chip label="短期 Memory" size="small" color="primary" sx={{ fontWeight:600 }} />
                <Typography variant="caption" color="text.secondary">Redis · TTL 30min</Typography>
              </Box>
              {SHORT_TERM.map((r) => (
                <Box key={r.label} sx={{ display:"flex", justifyContent:"space-between", py:1, borderBottom:"1px solid", borderColor:"divider" }}>
                  <Typography variant="caption" color="text.secondary">{r.label}</Typography>
                  <Typography variant="caption" fontWeight={600} fontFamily="monospace">{r.value}</Typography>
                </Box>
              ))}
              <Typography variant="caption" color="text.secondary" mt={1.5} display="block" fontSize={10}>
                Pipeline 生成完毕后自动异步回写，无需手动操作。Session 结束或超时后自动过期清理。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display:"flex", alignItems:"center", gap:1, mb:2 }}>
                <Chip label="长期 Memory" size="small" color="warning" sx={{ fontWeight:600 }} />
                <Typography variant="caption" color="text.secondary">向量库 · 持久化</Typography>
              </Box>
              {LONG_TERM.map((r) => (
                <Box key={r.label} sx={{ display:"flex", justifyContent:"space-between", py:1, borderBottom:"1px solid", borderColor:"divider" }}>
                  <Typography variant="caption" color="text.secondary">{r.label}</Typography>
                  <Typography variant="caption" fontWeight={600} fontFamily="monospace">{r.value}</Typography>
                </Box>
              ))}
              <Typography variant="caption" color="text.secondary" mt={1.5} display="block" fontSize={10}>
                短期 Memory 过期前，自动提取高价值结论压缩为向量摘要持久化，跨 Session 复用。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 智能路由策略 */}
      <Card sx={{ mb:2.5 }}>
        <CardContent>
          <Box sx={{ display:"flex", alignItems:"center", gap:1, mb:2 }}>
            <Typography variant="h3">智能路由策略</Typography>
            <Chip label="15 条规则 · 20 Prompt 版本" color="info" size="small" />
          </Box>
          <Table size="small">
            <TableHead><TableRow>
              {["优先级","规则名称","意图匹配","→ Prompt","Memory","命中率","状态"].map(h=>(
                <TableCell key={h} sx={{fontSize:10,fontWeight:600,color:"text.secondary"}}>{h}</TableCell>
              ))}
            </TableRow></TableHead>
            <TableBody>
              {RULES.map((r,i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{fontSize:11,fontFamily:"monospace",fontWeight:600}}>{r.pri}</TableCell>
                  <TableCell sx={{fontSize:11,fontWeight:600}}>{r.name}</TableCell>
                  <TableCell sx={{fontSize:11,fontFamily:"monospace",color:"text.secondary"}}>{r.intent}</TableCell>
                  <TableCell><Chip label={r.prompt} size="small" sx={{bgcolor:"primary.50",color:"primary.dark",fontWeight:600,fontSize:10}} /></TableCell>
                  <TableCell><Chip label={r.mem} size="small" color={r.memType} sx={{fontSize:10}} /></TableCell>
                  <TableCell sx={{fontSize:11,fontWeight:600,fontFamily:"monospace"}}>{r.hit}</TableCell>
                  <TableCell><Chip label="生效" size="small" color="success" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 路由流量分布 */}
      <Card sx={{ mb:2.5 }}>
        <CardContent>
          <Box sx={{ display:"flex", alignItems:"center", gap:1, mb:2.5 }}>
            <Typography variant="h3">路由流量分布 · 最近 24 小时</Typography>
            <Box sx={{ display:"flex", ml:"auto", bgcolor:"grey.200", borderRadius:2, p:0.25 }}>
              <Chip label="按意图" color="primary" size="small" />
              <Chip label="按 Prompt 版本" variant="outlined" size="small" sx={{ ml:0.5 }} />
            </Box>
          </Box>
          {TRAFFIC.map((t) => (
            <Box key={t.name} sx={{ display:"flex", alignItems:"center", gap:1.5, py:1, px:1.5, bgcolor:"grey.50", borderRadius:2, mb:1 }}>
              <Box sx={{ minWidth:130, display:"flex", alignItems:"center", gap:1 }}>
                <Box sx={{ width:8, height:8, borderRadius:"50%", bgcolor:t.color }} />
                <Typography variant="body2" fontWeight={600} fontSize={12}>{t.name}</Typography>
                <Typography variant="caption" color="text.secondary" fontSize={10}>{t.prompt}</Typography>
              </Box>
              <Box sx={{ flex:1, height:8, bgcolor:"grey.200", borderRadius:1, overflow:"hidden" }}>
                <Box sx={{ width:t.width, height:"100%", bgcolor:t.color, borderRadius:1 }} />
              </Box>
              <Box sx={{ minWidth:180, display:"flex", gap:2 }}>
                <Typography variant="caption" fontWeight={600} fontSize={11}>{t.count}</Typography>
                <Typography variant="caption" fontSize={11}>{t.pct}</Typography>
                <Typography variant="caption" color="success.main" fontWeight={600} fontSize={11}>{t.hit}</Typography>
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Memory 生命周期示例 */}
      <Card>
        <CardContent>
          <Box sx={{ display:"flex", alignItems:"center", gap:1, mb:2 }}>
            <Typography variant="h3">Memory 生命周期示例</Typography>
            <Chip label="自动 · 无需干预" color="info" size="small" />
          </Box>
          {TURNS.map((t, i) => (
            <Box key={i} sx={{ p:2, mb:1.5, bgcolor:"grey.50", borderRadius:2, borderLeft:"3px solid", borderLeftColor:i===0?"primary.main":i===1?"#00897b":"warning.main" }}>
              <Box sx={{ display:"flex", alignItems:"center", gap:1, mb:1, flexWrap:"wrap" }}>
                <Chip label={t.badge} color={t.badgeColor} size="small" />
                <Typography variant="body2" fontWeight={600} fontSize={12}>{t.q}</Typography>
                <Typography variant="caption" color="text.secondary">{t.route}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" fontSize={11} lineHeight={1.7}>{t.detail}</Typography>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}
