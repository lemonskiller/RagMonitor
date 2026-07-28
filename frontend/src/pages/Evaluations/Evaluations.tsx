import { Box, Typography, Card, CardContent, Button, Chip, Grid, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Select, MenuItem, LinearProgress } from "@mui/material";
import { Download, Play } from "lucide-react";

const EVAL_METRICS = [
  { label:"准确率", value:"88.2%", delta:"↑ 4.8", sub:"基准 83.4% · 689/781", color:"success.main", w:"88.2%" },
  { label:"相关性", value:"91.4%", delta:"↑ 3.2", sub:"基准 88.2% · 语义匹配度", color:"primary.main", w:"91.4%" },
  { label:"完整性", value:"79.6%", delta:"↑ 6.1", sub:"基准 73.5% · 评分点覆盖率", color:"warning.main", w:"79.6%" },
  { label:"幻觉率", value:"4.8%", delta:"↓ 2.1", sub:"基准 6.9% · 无依据陈述占比", color:"#e91e63", w:"4.8%" },
];
const DIMS = [{ n:"单库精查",b:62,c:78 },{ n:"跨库综合",b:68,c:74 },{ n:"机制解释",b:72,c:88 },{ n:"证据引用",b:70,c:71 },{ n:"诚实性",b:82,c:79 }];
const CASES = [
  { id:"QA-001",q:"盐浓度如何通过 Hofmeister 效应调控相变温度？",cat:"物理化学机制",b:"6.0",c:"10.0",d:"+4.0",e:0,t:"1.82s",up:true },
  { id:"Q01",q:"Nup116 是否包含朽病毒样结构域？",cat:"单库精查",b:"10.0",c:"6.0",d:"-4.0",e:1,t:"1.44s",up:false },
  { id:"QA-172",q:"如何区分 LLPS 中的静电与疏水驱动？",cat:"机制解释",b:"7.0",c:"9.0",d:"+2.0",e:0,t:"2.08s",up:true },
  { id:"QA-384",q:"归纳三篇非 OA 论文的相变证据",cat:"跨库综合",b:"8.0",c:"5.0",d:"-3.0",e:1,t:"3.94s",up:false },
];

export default function Evaluations() {
  return (<Box>
    <Box sx={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",mb:2.5 }}>
      <Box><Typography variant="h1">评测报告</Typography><Typography variant="body2" color="text.secondary">exp-028 · baseline-v1 vs candidate-v2 · 781 cases</Typography></Box>
      <Box sx={{ display:"flex",gap:1 }}><Button variant="outlined" size="small" startIcon={<Download size={14} />}>导出</Button><Button variant="contained" size="small" startIcon={<Play size={14} />}>新建评测</Button></Box>
    </Box>
    <Grid container spacing={2} sx={{mb:2.5}}>
      {[{ l:"总分",v:"82.4",s:"↑ 4.8" },{ l:"满分 Case",v:"41.2%",s:"↑ 6.1%" },{ l:"致命错误",v:"7",s:"↓ 5",cl:"error" },{ l:"P95 延迟",v:"2.18s",s:"↓ 180ms" },{ l:"预估成本",v:"¥12.60",s:"↑ ¥1.20" }].map((m,i)=>(
        <Grid item xs={6} sm={2.4} key={i}><Card><CardContent sx={{py:2.5,px:3}}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>{m.l}</Typography>
          <Typography variant="h5" fontWeight={600} mt={1} color={m.cl==="error"?"error.main":undefined}>{m.v}</Typography>
          <Typography variant="caption" color="text.secondary" mt={0.5}>{m.s}</Typography>
        </CardContent></Card></Grid>
      ))}
    </Grid>
    <Grid container spacing={2} sx={{mb:2.5}}>
      {EVAL_METRICS.map((m,i)=>(
        <Grid item xs={6} md={3} key={i}><Card><CardContent sx={{py:2.5,px:3}}>
          <Box sx={{ display:"flex",justifyContent:"space-between",mb:1 }}><Typography variant="caption" color="text.secondary" fontWeight={600}>{m.label}</Typography><Typography variant="caption" color="success.main" fontWeight={700}>{m.delta}</Typography></Box>
          <Typography variant="h5" fontWeight={600} color={m.color}>{m.value}</Typography>
          <LinearProgress variant="determinate" value={parseFloat(m.w)} sx={{mt:1.5,height:4,borderRadius:2,"& .MuiLinearProgress-bar":{bgcolor:m.color}}} />
          <Typography variant="caption" color="text.secondary" mt={0.5} display="block">{m.sub}</Typography>
        </CardContent></Card></Grid>
      ))}
    </Grid>
    <Grid container spacing={2} sx={{mb:2.5}}>
      <Grid item xs={12} md={7}><Card><CardContent>
        <Box sx={{ display:"flex",justifyContent:"space-between",mb:2 }}><Typography variant="h3">能力维度对比</Typography>
          <Box sx={{ display:"flex",gap:2 }}><Typography variant="caption"><Box component="span" sx={{width:8,height:8,borderRadius:"50%",bgcolor:"grey.400",display:"inline-block",mr:0.5}}/>Baseline</Typography><Typography variant="caption"><Box component="span" sx={{width:8,height:8,borderRadius:"50%",bgcolor:"primary.main",display:"inline-block",mr:0.5}}/>Candidate</Typography></Box></Box>
        <Box sx={{ display:"flex",alignItems:"flex-end",gap:3,height:160 }}>
          {DIMS.map((d,i)=>(<Box key={i} sx={{ flex:1,display:"flex",alignItems:"flex-end",justifyContent:"center",gap:0.8,position:"relative" }}>
            <Box sx={{ width:18,height:`${d.b}%`,bgcolor:"grey.300",borderRadius:"2px 2px 0 0" }}/><Box sx={{ width:18,height:`${d.c}%`,bgcolor:"primary.main",borderRadius:"2px 2px 0 0" }}/>
            <Typography variant="caption" color="text.secondary" fontSize={9} sx={{position:"absolute",bottom:-22}}>{d.n}</Typography></Box>))}
        </Box></CardContent></Card></Grid>
      <Grid item xs={12} md={5}><Card><CardContent><Typography variant="h3" mb={2}>Case 变化</Typography>
        {[["改善","+126","success.main"],["持平","616",""],["退化","-39","error.main"],["新增致命错误","2","error.main"]].map((r,i)=>(<Box key={i} sx={{display:"flex",justifyContent:"space-between",py:1,borderBottom:"1px solid",borderColor:"divider"}}><Typography variant="body2">{r[0]}</Typography><Typography variant="body2" fontWeight={700} color={r[2]}>{r[1]}</Typography></Box>))}
      </CardContent></Card></Grid>
    </Grid>
    <Box sx={{ display:"flex",gap:1,p:1.5,bgcolor:"background.paper",borderRadius:"12px 12px 0 0",border:"1px solid",borderColor:"divider" }}>
      <TextField size="small" placeholder="搜索 Case" sx={{minWidth:200}} /><Select size="small" defaultValue="all"><MenuItem value="all">全部结果</MenuItem></Select><Select size="small" defaultValue="all"><MenuItem value="all">全部数据集</MenuItem></Select>
      <Typography variant="caption" color="text.secondary" sx={{ml:"auto",alignSelf:"center"}}>781 cases</Typography></Box>
    <Card sx={{borderRadius:"0 0 12px 12px"}}><Table size="small">
      <TableHead><TableRow>{["Case","问题","Baseline","Candidate","差异","致命错误","耗时"].map(h=><TableCell key={h} sx={{fontSize:10,fontWeight:600}}>{h}</TableCell>)}</TableRow></TableHead>
      <TableBody>{CASES.map((c,i)=>(<TableRow key={i} hover><TableCell sx={{fontFamily:"monospace",fontSize:11}}>{c.id}</TableCell>
        <TableCell sx={{fontWeight:600,fontSize:11}}>{c.q}<br/><Typography variant="caption" color="text.secondary">{c.cat}</Typography></TableCell>
        <TableCell sx={{fontSize:12}}>{c.b}</TableCell><TableCell sx={{fontSize:12,fontWeight:700,color:c.up?"success.main":"error.main"}}>{c.c}</TableCell>
        <TableCell sx={{fontSize:12,fontWeight:700,color:c.up?"success.main":"error.main"}}>{c.d}</TableCell>
        <TableCell>{c.e>0&&<Chip label={String(c.e)} color="error" size="small"/>}</TableCell><TableCell sx={{fontFamily:"monospace",fontSize:11}}>{c.t}</TableCell></TableRow>))}</TableBody>
    </Table></Card>
  </Box>);
}
