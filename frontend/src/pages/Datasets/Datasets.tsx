import { Box, Typography, Card, CardContent, Button, Chip, Grid, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Select, MenuItem, LinearProgress } from "@mui/material";
import { Upload, Plus, MoreHorizontal } from "lucide-react";

export default function Datasets() {
  return (
    <Box>
      <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", mb:2.5 }}>
        <Box><Typography variant="h1">评测集</Typography><Typography variant="body2" color="text.secondary">管理调试集、回归集与保留集</Typography></Box>
        <Box sx={{ display:"flex", gap:1 }}>
          <Button variant="outlined" size="small" startIcon={<Upload size={14} />}>导入 JSON</Button>
          <Button variant="contained" size="small" startIcon={<Plus size={14} />}>新建评测集</Button>
        </Box>
      </Box>
      <Grid container spacing={2} sx={{ mb:2.5 }}>
        {[{ label:"评测集", value:"4", sub:"2 个活跃版本" },{ label:"Case 总数", value:"781", sub:"ID 全部唯一" },
          { label:"已配置评分点", value:"100%", sub:"2,208 scoring points" },{ label:"检索标注覆盖", value:"18%", sub:"142 cases" }].map((m,i)=>(
          <Grid item xs={6} sm={3} key={i}><Card><CardContent sx={{py:2.5,px:3}}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>{m.label}</Typography>
            <Typography variant="h5" fontWeight={600} mt={1}>{m.value}</Typography>
            <Typography variant="caption" color="text.secondary" mt={0.5}>{m.sub}</Typography>
          </CardContent></Card></Grid>
        ))}
      </Grid>
      <Box sx={{ display:"flex",gap:1,mb:0,p:1.5,bgcolor:"background.paper",borderRadius:"12px 12px 0 0",border:"1px solid",borderColor:"divider" }}>
        <TextField size="small" placeholder="搜索评测集" sx={{minWidth:240}} />
        <Select size="small" defaultValue="all"><MenuItem value="all">全部类型</MenuItem></Select>
      </Box>
      <Card sx={{ borderRadius:"0 0 12px 12px" }}>
        <Table size="small">
          <TableHead><TableRow>{["数据集","类型","Case","满分","检索标注","版本","最近更新",""].map(h=><TableCell key={h} sx={{fontSize:10,fontWeight:600}}>{h}</TableCell>)}</TableRow></TableHead>
          <TableBody>{[
            ["SDB 200 Question Bank","回归集","200","2,000","34%","v3","今天 09:30"],
            ["PSQA 581 L3/L4 + Non-OA","回归集","581","5,647","12%","v2","昨天 18:42"],
            ["Prompt Debug Set","调试集","23","230","78%","v7","3 天前"],
          ].map((r,i)=>(
            <TableRow key={i} hover><TableCell sx={{fontWeight:600,fontSize:12}}>{r[0]}<br/><Typography variant="caption" color="text.secondary" fontFamily="monospace">{r[0].toLowerCase().replace(/\s/g,"_")}.json</Typography></TableCell>
              <TableCell><Chip label={r[1]} color={r[1]==="回归集"?"info":"warning"} size="small" /></TableCell>
              <TableCell sx={{fontSize:12}}>{r[2]}</TableCell><TableCell sx={{fontSize:12}}>{r[3]}</TableCell>
              <TableCell><LinearProgress variant="determinate" value={parseInt(r[4])} sx={{width:80,height:4,borderRadius:2}} /></TableCell>
              <TableCell sx={{fontFamily:"monospace",fontSize:11}}>{r[5]}</TableCell><TableCell sx={{fontSize:11}}>{r[6]}</TableCell>
              <TableCell><Button size="small" sx={{minWidth:32}}><MoreHorizontal size={14} /></Button></TableCell></TableRow>
          ))}</TableBody>
        </Table>
      </Card>
    </Box>
  );
}
