import { useState } from "react";
import { Box, Typography, Card, CardContent, Button, Chip, Grid, TextField, Select, MenuItem, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { Save, Download, Bug, Copy, RotateCw, SlidersHorizontal, ShieldCheck, Timer, CircleAlert, OctagonX, RefreshCw, Workflow, Files, SearchCode, MessageSquareText, Braces } from "lucide-react";

const TRACES = [
  { id:"tr_9f2a18", q:"盐浓度如何通过 Hofmeister 效应调控相变温度？", ver:"candidate-v2", time:"10:42:18", lat:"1.82s", st:"success" },
  { id:"tr_82ab41", q:"Nup116 是否包含朽病毒样结构域？", ver:"candidate-v2", time:"10:41:52", lat:"1.44s", st:"quality" },
  { id:"tr_001ad7", q:"比较 FUS 和 TDP-43 的相分离机制", ver:"v2.4.0", time:"10:41:16", lat:"4.82s", st:"latency" },
  { id:"tr_b821a0", q:"给出特定文献中的实验浓度范围", ver:"v2.4.0", time:"10:40:42", lat:"620ms", st:"error" },
  { id:"tr_31cf90", q:"LLPS 体系中如何区分静电与疏水驱动？", ver:"candidate-v2", time:"10:39:58", lat:"2.04s", st:"success" },
  { id:"tr_ef3301", q:"总结三篇非 OA 论文中的相变证据", ver:"candidate-v2", time:"10:38:31", lat:"3.94s", st:"quality" },
];
const DG: Record<string,{ icon:typeof ShieldCheck; title:string; copy:string; conf:string; color:string }> = {
  success:{icon:ShieldCheck,title:"链路健康，回答命中全部评分点",copy:"召回覆盖 3/3 个关键证据，融合与 Rerank 排名一致。",conf:"0.96",color:"success.main"},
  quality:{icon:CircleAlert,title:"关键证据在 Rerank 后落出 Top 8",copy:"向量召回已找到证据，但 Rerank 将其从 #2 降至 #9。",conf:"0.91",color:"error.main"},
  latency:{icon:Timer,title:"LLM 首 Token 延迟显著升高",copy:"生成阶段耗时 4.31s，占总耗时 89.4%。",conf:"0.94",color:"warning.main"},
  error:{icon:OctagonX,title:"SQL 精查 Endpoint 返回 504",copy:"SQL exact 在 500ms 超时后终止。",conf:"0.99",color:"error.main"},
};
const SPANS = [
  { n:"Query validate",left:0,w:0.4,c:"primary.main",t:"6ms" },
  { n:"Query rewrite",left:0.4,w:4.5,c:"primary.main",t:"82ms" },
  { n:"Retrieval parallel",left:4.9,w:8.1,c:"#00897b",t:"148ms",dim:true },
  { n:"  Vector search",left:5.1,w:6.6,c:"#00897b",t:"121ms",in:true },
  { n:"  BM25",left:5.1,w:3.8,c:"#00897b",t:"69ms",in:true },
  { n:"  SQL exact",left:5.2,w:4.1,c:"#00897b",t:"74ms",in:true },
  { n:"Fusion + dedup",left:13,w:0.7,c:"#00897b",t:"12ms" },
  { n:"Rerank",left:13.7,w:11.8,c:"warning.main",t:"214ms" },
  { n:"Context assembly",left:25.5,w:0.3,c:"warning.main",t:"4ms" },
  { n:"LLM generate",left:26.3,w:73.7,c:"#e91e63",t:"1.35s" },
];
const SPAN_TREE = [
  { n:"Query validate",t:"6ms",c:"primary" },{ n:"Query rewrite",t:"82ms",c:"primary",in:true },
  { n:"Vector search",t:"121ms",c:"success",in:true },{ n:"BM25",t:"69ms",c:"success",in:true },
  { n:"SQL exact",t:"74ms",c:"success",in:true },{ n:"Fusion + dedup",t:"12ms",c:"success",in:true },
  { n:"Rerank",t:"214ms",c:"warning",in:true },{ n:"Context assembly",t:"4ms",c:"warning",in:true },
  { n:"LLM generate",t:"1.35s",c:"error",in:true },
];
const CANDIDATES = [
  { r:"#1", doc:"PNAS-2016-E4321 / 03", desc:"低盐阴离子结合", v:"0.517", b:"0.243", s:"0.150", g:"0.100", fusion:"0.910", rerank:"0.942", chg:"↑2", ctx:true },
  { r:"#2", doc:"HOF-LLPS-014 / 08", desc:"高盐电荷屏蔽", v:"0.491", b:"0.266", s:"0.150", g:"0.000", fusion:"0.907", rerank:"0.901", chg:"↓1", ctx:true },
  { r:"#3", doc:"PHASE-REVIEW-221 / 17", desc:"序列转换综述", v:"0.506", b:"0.207", s:"0.000", g:"0.000", fusion:"0.713", rerank:"0.876", chg:"↑4", ctx:true },
  { r:"#9", doc:"SALT-PHASE-092 / 04", desc:"非目标蛋白数据", v:"0.401", b:"0.188", s:"0.000", g:"0.000", fusion:"0.589", rerank:"0.422", chg:"↓4", ctx:false },
];

const TABS = [
  { id:"chain", icon:Workflow, label:"链路分析" },
  { id:"content", icon:Files, label:"完整内容" },
  { id:"retrieval", icon:SearchCode, label:"检索算分" },
  { id:"generation", icon:MessageSquareText, label:"Prompt / 回答" },
  { id:"metadata", icon:Braces, label:"元数据" },
];

export default function Traces() {
  const [sel,setSel]=useState("tr_9f2a18");
  const [tab,setTab]=useState("chain");
  const d=DG[TRACES.find(t=>t.id===sel)?.st||"success"];

  return (<Box>
    <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",mb:2.5}}>
      <Box><Typography variant="h1">Trace 分析</Typography><Typography variant="body2" color="text.secondary">从一次线上请求定位召回、排序、Prompt、生成与性能问题</Typography></Box>
      <Box sx={{display:"flex",gap:1}}><Button variant="outlined" size="small" startIcon={<Save size={14}/>}>保存视图</Button><Button variant="outlined" size="small" startIcon={<Download size={14}/>}>导出</Button><Button variant="contained" size="small" startIcon={<Bug size={14}/>}>加入 Bad Case</Button></Box>
    </Box>
    <Box sx={{display:"flex",gap:1,mb:2,p:1.5,bgcolor:"background.paper",borderRadius:3,border:"1px solid",borderColor:"divider"}}>
      <TextField size="small" placeholder="Trace ID、Query" sx={{minWidth:200}}/><Select size="small" defaultValue="24h"><MenuItem value="24h">最近 24 小时</MenuItem></Select>
      <Select size="small" defaultValue="all"><MenuItem value="all">全部状态</MenuItem></Select><Select size="small" defaultValue="all"><MenuItem value="all">全部版本</MenuItem></Select>
      <Button size="small" startIcon={<SlidersHorizontal size={14}/>}>更多筛选</Button></Box>
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}><Card><CardContent sx={{py:1}}>
        <Box sx={{display:"flex",justifyContent:"space-between",mb:1}}><Typography variant="subtitle2">8,420 traces</Typography><Chip label="实时" color="success" size="small"/></Box>
        {TRACES.map(t=>(<Box key={t.id} onClick={()=>setSel(t.id)} sx={{py:1.2,px:1.5,borderRadius:2,cursor:"pointer",bgcolor:sel===t.id?"primary.50":"transparent",borderLeft:sel===t.id?"3px solid":"3px solid transparent",borderLeftColor:sel===t.id?"primary.main":"transparent","&:hover":{bgcolor:"grey.50"}}}>
          <Typography variant="body2" fontWeight={600} fontSize={12} noWrap>{t.q}</Typography>
          <Box sx={{display:"flex",justifyContent:"space-between",mt:0.5}}><Typography variant="caption" color="text.secondary" fontFamily="monospace">{t.id} · {t.ver} · {t.time}</Typography>
            <Box sx={{display:"flex",alignItems:"center",gap:1}}><Chip label={t.st==="success"?"成功":t.st==="quality"?"低分":t.st==="latency"?"高延迟":"错误"} color={t.st==="success"?"success":t.st==="latency"?"warning":"error"} size="small"/><Typography variant="caption" fontFamily="monospace">{t.lat}</Typography></Box></Box></Box>))}
        <Box sx={{display:"flex",justifyContent:"space-between",mt:1,pt:1,borderTop:"1px solid",borderColor:"divider"}}><Typography variant="caption" color="text.secondary">显示最近 6 条</Typography><Button size="small" startIcon={<RefreshCw size={12}/>}>刷新</Button></Box>
      </CardContent></Card></Grid>
      <Grid item xs={12} md={8}><Card><CardContent>
        <Box sx={{display:"flex",justifyContent:"space-between",mb:2}}><Box sx={{display:"flex",alignItems:"center",gap:1,flexWrap:"wrap"}}><Typography variant="h3" fontFamily="monospace">{sel}</Typography><Chip label="SUCCESS" color="success" size="small"/><Typography variant="caption" color="text.secondary">2026-07-25</Typography></Box>
          <Box><Button size="small"><Copy size={12}/></Button><Button size="small" startIcon={<RotateCw size={12}/>}>重放</Button></Box></Box>
        <Grid container spacing={1} sx={{mb:2}}>{[["candidate-v2","版本"],["1.82s","耗时"],["6,102/1,142","Token"],["¥0.0038","成本"],["usr_28af","User"],["10/10","得分"]].map((r,i)=>(<Grid item xs={4} sm={2} key={i}><Typography variant="caption" color="text.secondary" fontSize={9}>{r[1]}</Typography><Typography variant="body2" fontWeight={700} fontFamily="monospace" fontSize={11}>{r[0]}</Typography></Grid>))}</Grid>
        <Box sx={{p:2,borderRadius:2,bgcolor:d.color==="success.main"?"#e8f5e9":d.color==="error.main"?"#ffebee":"#fff3e0",borderLeft:"4px solid",borderLeftColor:d.color,mb:2,display:"flex",alignItems:"center",gap:1.5}}>
          <d.icon size={20} color={d.color}/><Box><Typography variant="body2" fontWeight={600}>{d.title}</Typography><Typography variant="caption" color="text.secondary">{d.copy}</Typography></Box>
          <Box sx={{ml:"auto",textAlign:"right"}}><Typography variant="caption" color="text.secondary">置信度</Typography><Typography variant="body2" fontWeight={700} fontFamily="monospace">{d.conf}</Typography></Box></Box>

        {/* Tab bar */}
        <Box sx={{display:"flex",gap:0,borderBottom:"1px solid",borderColor:"divider",mb:2}}>
          {TABS.map(t=>(<Button key={t.id} size="small" startIcon={<t.icon size={14}/>}
            color={tab===t.id?"primary":"inherit"}
            onClick={()=>setTab(t.id)}
            sx={{borderRadius:0,borderBottom:"2px solid",borderBottomColor:tab===t.id?"primary.main":"transparent",fontSize:11}}>
            {t.label}</Button>))}
        </Box>

        {/* Tab: 链路分析 */}
        {tab==="chain" && <Box>
          <Grid container spacing={1}>
            <Grid item xs={4}><Box sx={{p:1,borderRight:"1px solid",borderColor:"divider"}}>
              {SPAN_TREE.map((s,i)=>(<Box key={i} sx={{display:"flex",alignItems:"center",gap:1,py:0.3,pl:s.in?2:0}}>
                <Box sx={{width:7,height:7,borderRadius:"50%",bgcolor:`${s.c}.main`,flexShrink:0}}/>
                <Typography variant="caption" fontSize={10} sx={{flex:1}}>{s.n}</Typography>
                <Typography variant="caption" fontFamily="monospace" fontSize={9} color="text.secondary">{s.t}</Typography></Box>))}
            </Box></Grid>
            <Grid item xs={8}><Box sx={{p:1}}>
              <Typography variant="caption" fontWeight={600} display="block" mb={1}>Rerank · span_07</Typography>
              <Table size="small"><TableHead><TableRow>{["Chunk","融合排名","Rerank","最终"].map(h=><TableCell key={h} sx={{fontSize:9,py:0.5}}>{h}</TableCell>)}</TableRow></TableHead>
                <TableBody>{[["PNAS-2016 / 03","#3","0.942","#1 ↑2"],["HOF-LLPS-014 / 08","#1","0.901","#2 ↓1"],["PHASE-REVIEW / 17","#7","0.876","#3 ↑4"]].map((r,i)=>(<TableRow key={i}>
                  <TableCell sx={{fontSize:9,fontWeight:600,py:0.5}}>{r[0]}</TableCell><TableCell sx={{fontSize:9,fontFamily:"monospace",py:0.5}}>{r[1]}</TableCell>
                  <TableCell sx={{fontSize:9,color:"success.main",fontWeight:700,fontFamily:"monospace",py:0.5}}>{r[2]}</TableCell><TableCell sx={{fontSize:9,fontFamily:"monospace",py:0.5}}>{r[3]}</TableCell></TableRow>))}</TableBody></Table>
              <Typography variant="caption" color="text.secondary" mt={1} display="block" fontSize={9}>Rerank 将同时覆盖低盐结合和序列转换的证据提升至 Top 3，关键证据没有落出 Context Top 8。</Typography>
            </Box></Grid></Grid></Box>}

        {/* Tab: 完整内容 */}
        {tab==="content" && <Box sx={{maxHeight:420,overflow:"auto"}}>
          {[["Query","在探究带正电荷的球蛋白发生液-液相分离时，盐浓度如何通过影响 Hofmeister 效应来调控相变温度？请分别说明低盐和高盐阶段的主导机制。"],
            ["Context","[source:1 | PNAS-2016-E4321 | chunk:03]\nAt low salt concentrations, direct anion binding to positively charged protein surfaces dominates...\n\n[source:2 | HOF-LLPS-014 | chunk:08]\nAt high ionic strength, electrostatic interactions are screened...\n\n[source:3 | PHASE-REVIEW-221 | chunk:17]\nThe crossover from inverse to direct Hofmeister behavior occurs..."],
            ["Prompt","[SYSTEM]\n你是一名生物医学研究助手。只使用 context 中能够核验的信息；证据不足时明确说明不确定性。每个关键结论后使用 [source:n] 标注来源。\n\n[USER]\n已知资料：{{rendered_context}}\n用户问题：{{question}}"],
            ["Answer","盐浓度升高会使该体系经历由反向到正向 Hofmeister 序列的转换。\n\n低盐阶段，阴离子与带正电蛋白表面的直接静电结合占主导，不同阴离子的结合能力决定相分离稳定性，表现为反向 Hofmeister 序列。[source:1]\n\n高盐阶段，电荷被显著屏蔽，离子极化率和水化/表面张力效应成为主导，因此转为正向 Hofmeister 序列。[source:2][source:3]"],
          ].map(([title,text])=>(
            <Box key={title} sx={{mb:2}}>
              <Box sx={{display:"flex",justifyContent:"space-between",p:1,bgcolor:"grey.50",borderRadius:"4px 4px 0 0"}}><Typography variant="caption" fontWeight={600}>{title}</Typography><Button size="small" sx={{minWidth:24}}><Copy size={10}/></Button></Box>
              <Box sx={{p:1.5,border:"1px solid",borderColor:"divider",borderTop:0,borderRadius:"0 0 4px 4px",fontSize:10,fontFamily:"monospace",whiteSpace:"pre-wrap",lineHeight:1.6,color:"text.secondary",maxHeight:160,overflow:"auto"}}>{text}</Box>
            </Box>))}
        </Box>}

        {/* Tab: 检索算分 */}
        {tab==="retrieval" && <Box>
          <Box sx={{mb:2,p:2,bgcolor:"grey.50",borderRadius:2,borderLeft:"4px solid",borderLeftColor:"primary.main"}}>
            <Box sx={{display:"flex",alignItems:"center",gap:1,mb:1}}><Typography variant="caption" fontWeight={700}>融合公式</Typography><Chip label="fusion-score-v6" color="info" size="small"/></Box>
            <Typography variant="caption" fontFamily="monospace" fontSize={11} display="block" fontWeight={700} color="primary.main" mb={1}>
              S(d) = 0.55 × Vₙ(d) + 0.30 × Bₙ(d) + 0.15 × SQL(d) + 0.10 × G(d)
            </Typography>
            <Grid container spacing={1}>{[["归一化","Min-Max / route"],["缺失路由","score=0"],["范围","clamp [0,1]"]].map(([l,v])=>(<Grid item xs={4} key={l}><Typography variant="caption" color="text.secondary" fontSize={9}>{l}</Typography><Typography variant="caption" fontWeight={600} fontFamily="monospace" fontSize={9} display="block">{v}</Typography></Grid>))}</Grid></Box>
          <Table size="small"><TableHead><TableRow>{["排名","文档/Chunk","Vector","BM25","SQL","Graph","融合分","Rerank","变化","Context"].map(h=><TableCell key={h} sx={{fontSize:8,py:0.5}}>{h}</TableCell>)}</TableRow></TableHead>
            <TableBody>{CANDIDATES.map((c,i)=>(<TableRow key={i}><TableCell sx={{fontSize:9,fontFamily:"monospace",py:0.5}}>{c.r}</TableCell>
              <TableCell sx={{fontSize:9,fontWeight:600,py:0.5}}>{c.doc}<br/><Typography variant="caption" fontSize={8} color="text.secondary">{c.desc}</Typography></TableCell>
              <TableCell sx={{fontSize:9,fontFamily:"monospace",py:0.5}}>{c.v}</TableCell><TableCell sx={{fontSize:9,fontFamily:"monospace",py:0.5}}>{c.b}</TableCell>
              <TableCell sx={{fontSize:9,fontFamily:"monospace",py:0.5}}>{c.s}</TableCell><TableCell sx={{fontSize:9,fontFamily:"monospace",py:0.5}}>{c.g}</TableCell>
              <TableCell sx={{fontSize:9,fontFamily:"monospace",fontWeight:600,py:0.5}}>{c.fusion}</TableCell>
              <TableCell sx={{fontSize:9,fontFamily:"monospace",color:c.r==="#1"?"success.main":"text.primary",fontWeight:700,py:0.5}}>{c.rerank}</TableCell>
              <TableCell sx={{fontSize:9,fontWeight:700,color:c.chg.startsWith("↑")?"success.main":"error.main",py:0.5}}>{c.chg}</TableCell>
              <TableCell>{c.ctx?<Chip label="是" color="success" size="small" sx={{fontSize:9,height:18}}/>:<Chip label="否" size="small" sx={{fontSize:9,height:18}}/>}</TableCell></TableRow>))}</TableBody></Table>
        </Box>}

        {/* Tab: Prompt / 回答 */}
        {tab==="generation" && <Box>
          <Grid container spacing={1} sx={{mb:2}}>{[["System","238"],["Question","24"],["Context","5,840"],["总输入","6,102"]].map(([l,v])=>(<Grid item xs={3} key={l}><Box sx={{p:1,textAlign:"center",bgcolor:"grey.50",borderRadius:2}}><Typography variant="caption" color="text.secondary" fontSize={9}>{l}</Typography><Typography variant="body2" fontWeight={700} fontFamily="monospace" fontSize={12}>{v}</Typography></Box></Grid>))}</Grid>
          <Box sx={{mb:2}}><Typography variant="caption" fontWeight={600} display="block" mb={0.5}>System Prompt · prompt-v12</Typography>
            <Box sx={{p:1.5,bgcolor:"#1e1e1e",borderRadius:2,fontSize:10,fontFamily:"monospace",color:"#e8eaed",lineHeight:1.7,maxHeight:140,overflow:"auto"}}>
              <span style={{color:"#89ddff"}}>你是一名生物医学研究助手。请基于提供的证据回答问题。回答要求：只使用 context 中能够核验的信息；先给出结论再解释证据链；每个关键结论后使用 [source:n] 标注来源。</span></Box></Box>
          <Box sx={{mb:2}}><Typography variant="caption" fontWeight={600} display="block" mb={0.5}>Answer · gpt-4.1-mini · 1.35s · 1,142 tokens</Typography>
            <Box sx={{p:1.5,border:"1px solid",borderColor:"divider",borderRadius:2,fontSize:11,lineHeight:1.7,color:"text.secondary"}}>盐浓度升高会使体系经历由反向到正向 Hofmeister 序列的转换。低盐阶段，阴离子与带正电蛋白表面的直接静电结合占主导，表现为反向 Hofmeister 序列。[source:1] 高盐阶段，电荷被显著屏蔽，离子极化率和表面张力效应成为主导，因此转为正向序列。[source:2][source:3]</Box></Box>
          <Table size="small"><TableHead><TableRow>{["引用","支持结论","来源排名","状态"].map(h=><TableCell key={h} sx={{fontSize:9,py:0.5}}>{h}</TableCell>)}</TableRow></TableHead>
            <TableBody>{[["source:1","低盐直接阴离子结合","#1","有效"],["source:2","高盐电荷屏蔽","#2","有效"],["source:3","序列转换","#3","有效"]].map((r,i)=>(<TableRow key={i}><TableCell sx={{fontSize:9,fontFamily:"monospace",py:0.5}}>{r[0]}</TableCell><TableCell sx={{fontSize:9,py:0.5}}>{r[1]}</TableCell><TableCell sx={{fontSize:9,fontFamily:"monospace",py:0.5}}>{r[2]}</TableCell><TableCell><Chip label={r[3]} color="success" size="small" sx={{fontSize:9,height:18}}/></TableCell></TableRow>))}</TableBody></Table>
        </Box>}

        {/* Tab: 元数据 */}
        {tab==="metadata" && <Box>
          <Box sx={{p:2,bgcolor:"#1e1e1e",borderRadius:2,fontSize:10,fontFamily:"monospace",color:"#e8eaed",lineHeight:1.8,whiteSpace:"pre-wrap",maxHeight:420,overflow:"auto"}}>
{`{
  "trace_id": "${sel}",
  "app_id": "research-rag",
  "environment": "production",
  "version_id": "candidate-v2",
  "session_id": "sess_71c09d",
  "user_id": "usr_28af",
  "sdk": { "name": "ragscope-python", "version": "0.3.2" },
  "request": { "endpoint": "/v1/answer", "method": "POST" },
  "model": { "provider": "openai", "name": "gpt-4.1-mini", "temperature": 0.2, "max_output_tokens": 2048 },
  "tags": ["online", "biomed", "candidate"],
  "feedback": null
}`}</Box></Box>}
      </CardContent></Card></Grid></Grid>
  </Box>);
}
