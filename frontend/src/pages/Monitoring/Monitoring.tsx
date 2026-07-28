import { Box, Typography, Card, CardContent, Button, Chip, Grid, Table, TableBody,
  TableCell, TableHead, TableRow } from "@mui/material";
import { BellPlus } from "lucide-react";

const METRICS = [
  { l:"Trace",v:"8,420",s:"98.7% 采样" },{ l:"成功率",v:"99.42%",s:"稳定" },
  { l:"P95",v:"2.18s",s:"+8.2%",cl:"error" },{ l:"空召回率",v:"1.8%",s:"-0.4%" },
  { l:"今日成本",v:"¥28.42",s:"7.4M tokens" },
];
const ANOMALIES = [
  { t:"今天 09:20", m:"Rerank P95", v:"318ms", b:"240ms", n:312, s:"观察中" },
  { t:"昨天 21:05", m:"空召回率", v:"4.2%", b:"1.9%", n:68, s:"已恢复" },
];

export default function Monitoring() {
  return (<Box>
    <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",mb:2.5}}>
      <Box><Typography variant="h1">性能监控</Typography><Typography variant="body2" color="text.secondary">线上流量、阶段耗时、错误与成本</Typography></Box>
      <Box sx={{bgcolor:"grey.200",borderRadius:2,p:0.25,display:"flex"}}>
        {["24 小时","7 天","30 天"].map((t,i)=>(<Chip key={i} label={t} color={i===0?"primary":undefined} variant={i===0?"filled":"outlined"} size="small" sx={{ml:i>0?0.5:0}}/>))}
      </Box>
    </Box>
    <Grid container spacing={2} sx={{mb:2.5}}>
      {METRICS.map((m,i)=>(<Grid item xs={6} sm={2.4} key={i}><Card><CardContent sx={{py:2.5,px:3}}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>{m.l}</Typography>
        <Typography variant="h5" fontWeight={600} mt={1} color={m.cl==="error"?"error.main":undefined}>{m.v}</Typography>
        <Typography variant="caption" color="text.secondary" mt={0.5}>{m.s}</Typography>
      </CardContent></Card></Grid>))}
    </Grid>
    <Grid container spacing={2} sx={{mb:2.5}}>
      <Grid item xs={12} md={7}><Card><CardContent>
        <Box sx={{display:"flex",justifyContent:"space-between",mb:2}}><Typography variant="h3">端到端延迟</Typography><Chip label="P95 偏高" color="warning" size="small"/></Box>
        <Box sx={{height:180,bgcolor:"grey.50",borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Typography variant="caption" color="text.secondary">延迟趋势图 (Grafana 集成)</Typography>
        </Box></CardContent></Card></Grid>
      <Grid item xs={12} md={5}><Card><CardContent>
        <Typography variant="h3" mb={2}>阶段 P95</Typography>
        {[["Query rewrite","104ms"],["Retrieval","182ms"],["Rerank","318ms"],["LLM generation","1.62s"]].map((r,i)=>(<Box key={i} sx={{display:"flex",justifyContent:"space-between",py:1,borderBottom:"1px solid",borderColor:"divider"}}><Typography variant="body2">{r[0]}</Typography><Typography variant="body2" fontWeight={700} fontFamily="monospace" color={i===2?"error.main":undefined}>{r[1]}</Typography></Box>))}
      </CardContent></Card></Grid>
    </Grid>
    <Card><CardContent>
      <Box sx={{display:"flex",justifyContent:"space-between",mb:2}}><Typography variant="h3">异常时间段</Typography><Button size="small" startIcon={<BellPlus size={14}/>}>新建告警</Button></Box>
      <Table size="small"><TableHead><TableRow>{["开始时间","指标","观测值","基线","影响 Trace","状态"].map(h=><TableCell key={h} sx={{fontSize:10,fontWeight:600}}>{h}</TableCell>)}</TableRow></TableHead>
        <TableBody>{ANOMALIES.map((a,i)=>(<TableRow key={i}><TableCell sx={{fontSize:11}}>{a.t}</TableCell><TableCell sx={{fontSize:11}}>{a.m}</TableCell><TableCell sx={{fontSize:11,fontWeight:700,color:"error.main"}}>{a.v}</TableCell><TableCell sx={{fontSize:11}}>{a.b}</TableCell><TableCell sx={{fontSize:11}}>{a.n}</TableCell><TableCell><Chip label={a.s} color={a.s==="观察中"?"warning":"success"} size="small"/></TableCell></TableRow>))}</TableBody></Table>
    </CardContent></Card>
  </Box>);
}
