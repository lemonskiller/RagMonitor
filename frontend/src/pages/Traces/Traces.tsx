import { useState } from "react";
import { Box, Typography, Card, CardContent, Button, Chip, Grid, TextField, Select, MenuItem } from "@mui/material";
import { Save, Download, Bug, Copy, RotateCw, SlidersHorizontal, ShieldCheck, Timer, CircleAlert, OctagonX, RefreshCw } from "lucide-react";

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
  { n:"Query validate",p:0.4,c:"primary.main",t:"6ms" },{ n:"Query rewrite",p:4.5,c:"primary.main",t:"82ms" },
  { n:"Retrieval",p:8.1,c:"#00897b",t:"148ms" },{ n:"  Vector",p:6.6,c:"#00897b",t:"121ms",in:true },
  { n:"  BM25",p:3.8,c:"#00897b",t:"69ms",in:true },{ n:"  SQL",p:4.1,c:"#00897b",t:"74ms",in:true },
  { n:"Fusion",p:0.7,c:"#00897b",t:"12ms" },{ n:"Rerank",p:11.8,c:"warning.main",t:"214ms" },
  { n:"Context",p:0.3,c:"warning.main",t:"4ms" },{ n:"LLM",p:73.7,c:"#e91e63",t:"1.35s" },
];

export default function Traces() {
  const [sel,setSel]=useState("tr_9f2a18");
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
        <Typography variant="subtitle2" fontWeight={600} mb={1}>Span 瀑布 · {SPANS.length} spans</Typography>
        {SPANS.map((s,i)=>(<Box key={i} sx={{display:"flex",alignItems:"center",gap:1,mb:0.5}}>
          <Typography variant="caption" sx={{width:120,fontSize:10,pl:s.in?2:0,color:s.in?"text.secondary":"text.primary"}}>{s.n}</Typography>
          <Box sx={{flex:1,height:8,bgcolor:"grey.100",borderRadius:1,overflow:"hidden"}}><Box sx={{height:"100%",width:`${s.p}%`,bgcolor:s.c,borderRadius:1}}/></Box>
          <Typography variant="caption" fontFamily="monospace" fontSize={10} sx={{width:50,textAlign:"right"}}>{s.t}</Typography></Box>))}
        <Box sx={{display:"flex",gap:0,mt:2,borderBottom:"1px solid",borderColor:"divider"}}>{["链路分析","完整内容","检索算分","Prompt/回答","元数据"].map((t,i)=>(<Button key={i} size="small" color={i===0?"primary":"inherit"} sx={{borderRadius:0,borderBottom:i===0?"2px solid":"2px solid transparent",borderBottomColor:i===0?"primary.main":"transparent"}}>{t}</Button>))}</Box>
      </CardContent></Card></Grid></Grid>
  </Box>);
}
