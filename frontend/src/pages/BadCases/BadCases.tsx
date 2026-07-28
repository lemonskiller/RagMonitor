import { Box, Typography, Card, CardContent, Button, Chip, Grid, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Select, MenuItem } from "@mui/material";
import { Download, Plus } from "lucide-react";

export default function BadCases() {
  return (<Box>
    <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",mb:2.5}}>
      <Box><Typography variant="h1">Bad Case</Typography><Typography variant="body2" color="text.secondary">定位线上问题，回流评测集并追踪修复</Typography></Box>
      <Box sx={{display:"flex",gap:1}}><Button variant="outlined" size="small" startIcon={<Download size={14}/>}>导出</Button><Button variant="contained" size="small" startIcon={<Plus size={14}/>}>手动添加</Button></Box>
    </Box>
    <Grid container spacing={2} sx={{mb:2.5}}>
      {[{l:"待处理",v:"7"},{l:"已定位",v:"12"},{l:"优化中",v:"4"},{l:"已验证",v:"18"}].map((m,i)=>(<Grid item xs={6} sm={3} key={i}><Card><CardContent sx={{py:2.5,px:3}}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>{m.l}</Typography><Typography variant="h5" fontWeight={600} mt={1}>{m.v}</Typography>
      </CardContent></Card></Grid>))}
    </Grid>
    <Box sx={{display:"flex",gap:1,mb:0,p:1.5,bgcolor:"background.paper",borderRadius:"12px 12px 0 0",border:"1px solid",borderColor:"divider"}}>
      <TextField size="small" placeholder="搜索 Query 或 Trace ID" sx={{minWidth:220}}/><Select size="small" defaultValue="all"><MenuItem value="all">全部状态</MenuItem></Select><Select size="small" defaultValue="all"><MenuItem value="all">全部原因</MenuItem></Select></Box>
    <Card sx={{borderRadius:"0 0 12px 12px"}}><Table size="small">
      <TableHead><TableRow>{["问题","来源","触发原因","归因","状态","负责人","时间"].map(h=><TableCell key={h} sx={{fontSize:10,fontWeight:600}}>{h}</TableCell>)}</TableRow></TableHead>
      <TableBody>{[
        ["Nup116 结构域坐标错误","致命错误","评分 6/10","排序问题","已定位","Yang","21 分钟前"],
        ["非 OA 论文证据引用不完整","点踩","用户反馈","Context 截断","待处理","未分配","1 小时前"],
        ["相变机制回答只覆盖高盐阶段","低分","5/10","Prompt 问题","优化中","Mori","3 小时前"],
      ].map((r,i)=>(<TableRow key={i} hover>
        <TableCell sx={{fontWeight:600,fontSize:11}}>{r[0]}<br/><Typography variant="caption" fontFamily="monospace" color="text.secondary">trace_id</Typography></TableCell>
        <TableCell><Chip label={r[1]} color={r[1]==="致命错误"?"error":"warning"} size="small"/></TableCell><TableCell sx={{fontSize:11}}>{r[2]}</TableCell>
        <TableCell sx={{fontSize:11}}>{r[3]}</TableCell><TableCell><Chip label={r[4]} color={r[4]==="待处理"?"error":r[4]==="已定位"?"warning":"info"} size="small"/></TableCell>
        <TableCell sx={{fontSize:11}}>{r[5]}</TableCell><TableCell sx={{fontSize:11}}>{r[6]}</TableCell></TableRow>))}
      </TableBody></Table></Card>
  </Box>);
}
