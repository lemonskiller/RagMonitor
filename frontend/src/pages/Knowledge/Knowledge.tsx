import { useState } from "react";
import { Box, Typography, Card, CardContent, Button, Chip, Grid, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Select, MenuItem, Switch, Paper } from "@mui/material";
import { Upload, RefreshCw, Database, FileText, WandSparkles, Split, Image, GitCompareArrows, Layers3, Dices, ChevronDown, ChevronRight } from "lucide-react";

const STAGES = [
  { id:"documents", icon:FileText, label:"文档", badge:"18,420" },
  { id:"parsing", icon:WandSparkles, label:"解析与清洗" },
  { id:"chunking", icon:Split, label:"分块预览" },
  { id:"multimodal", icon:Image, label:"多模态解析", badge:"3 模态" },
  { id:"dedup", icon:GitCompareArrows, label:"去重检测", badge:"18 待确认" },
  { id:"indexes", icon:Layers3, label:"索引版本", badge:"idx-024" },
];

export default function Knowledge() {
  const [activeStage, setActiveStage] = useState("documents");

  return (
    <Box>
      <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", mb:2.5 }}>
        <Box><Typography variant="h1">知识库 / phase-db</Typography><Typography variant="body2" color="text.secondary">管理文档、解析清洗、分块与索引版本</Typography></Box>
        <Box sx={{ display:"flex", gap:1 }}>
          <Button variant="outlined" size="small" startIcon={<Database size={14} />}>切换知识库</Button>
          <Button variant="outlined" size="small" startIcon={<RefreshCw size={14} />}>同步数据</Button>
          <Button variant="contained" size="small" startIcon={<Upload size={14} />}>上传文档</Button>
        </Box>
      </Box>

      <Card sx={{ mb:2 }}>
        <CardContent sx={{ display:"flex", alignItems:"center", gap:3, py:2 }}>
          <Box sx={{ display:"flex", alignItems:"center", gap:1.5, pr:3, borderRight:"1px solid", borderColor:"divider" }}>
            <Database size={22} color="#673ab7" />
            <Box><Typography variant="body2" fontWeight={700}>phase-db</Typography><Typography variant="caption" color="text.secondary">S3 / phase-prod</Typography></Box>
          </Box>
          {[["文档","18,420"],["Chunk","162,804"],["当前索引","idx-024"],["最近同步","12 分钟前"]].map(([l,v]) => (
            <Box key={l} sx={{ px:3, borderRight:"1px solid", borderColor:"grey.100" }}>
              <Typography variant="caption" color="text.secondary">{l}</Typography>
              <Typography variant="body2" fontWeight={700} fontFamily="monospace" mt={0.5}>{v}</Typography>
            </Box>
          ))}
          <Chip label="可用" color="success" size="small" />
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ py:1 }}>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>处理阶段</Typography>
              {STAGES.map((s) => (
                <Box key={s.id} onClick={() => setActiveStage(s.id)}
                  sx={{ display:"flex", alignItems:"center", gap:1, px:1.5, py:1.2, borderRadius:2, cursor:"pointer",
                    bgcolor: activeStage===s.id?"primary.50":"transparent", color: activeStage===s.id?"primary.dark":"text.secondary",
                    fontWeight: activeStage===s.id?600:500, "&:hover":{bgcolor:"grey.100"} }}>
                  <s.icon size={16} />
                  <Typography variant="body2" fontWeight="inherit" fontSize={12} sx={{ flex:1 }}>{s.label}</Typography>
                  {s.badge && <Chip label={s.badge} size="small" color={activeStage===s.id?"primary":"default"} />}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={9}>
          <Card sx={{ minHeight:400 }}>
            <CardContent>
              {activeStage==="documents" && (
                <Box>
                  <Box sx={{ display:"flex", gap:1, mb:2 }}>
                    <TextField size="small" placeholder="搜索文件名、标签或来源" sx={{ flex:1 }} />
                    <Select size="small" defaultValue="all"><MenuItem value="all">全部类型</MenuItem></Select>
                    <Select size="small" defaultValue="all"><MenuItem value="all">全部状态</MenuItem></Select>
                    <Button size="small" variant="outlined" startIcon={<Dices size={14} />}>随机抽样</Button>
                  </Box>
                  <Table size="small">
                    <TableHead><TableRow>{["文档","来源","解析器","Chunk","去重","状态","更新时间"].map(h=><TableCell key={h} sx={{fontSize:11,fontWeight:600}}>{h}</TableCell>)}</TableRow></TableHead>
                    <TableBody>{[
                      ["LLPS_review_2025.pdf","phase-prod/papers","PDF Layout v3","684","无重复","已入库","12 分钟前"],
                      ["PNAS-2016-E4321.pdf","phase-prod/papers","PDF Layout v3","72","无重复","已入库","2 小时前"],
                    ].map((r,i)=>(
                      <TableRow key={i} hover><TableCell sx={{fontSize:11,fontWeight:600}}>{r[0]}</TableCell><TableCell sx={{fontSize:11}}>{r[1]}</TableCell><TableCell sx={{fontSize:11}}>{r[2]}</TableCell><TableCell sx={{fontSize:11,fontFamily:"monospace"}}>{r[3]}</TableCell><TableCell><Chip label={r[4]} color="success" size="small" /></TableCell><TableCell><Chip label={r[5]} color="success" size="small" /></TableCell><TableCell sx={{fontSize:11}}>{r[6]}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              )}
              {activeStage==="chunking" && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" fontWeight={600} mb={2}>切片策略</Typography>
                    {[{ label:"固定长度切片",desc:"按 token 数等距切分",on:true },{ label:"文档结构切分",desc:"按标题/段落层级切分",on:true },{ label:"语义切分",desc:"基于 embedding 相似度断点",on:true },{ label:"递归切分",desc:"逐级尝试分隔符，超长则降级",on:false },{ label:"自定义切分",desc:"正则/分隔符/固定模式",on:false }].map((s,i)=>(
                      <Box key={i} sx={{ display:"flex",justifyContent:"space-between",alignItems:"center",py:1,borderBottom:"1px solid",borderColor:"divider" }}>
                        <Box><Typography variant="body2" fontWeight={600} fontSize={12}>{s.label}</Typography><Typography variant="caption" color="text.secondary">{s.desc}</Typography></Box>
                        <Switch size="small" defaultChecked={s.on} />
                      </Box>
                    ))}
                    <Box sx={{ mt:2,display:"flex",justifyContent:"space-between" }}><Typography variant="caption">预计 Chunk</Typography><Typography fontWeight={700} fontFamily="monospace">684</Typography></Box>
                    <Button variant="contained" fullWidth size="small" sx={{ mt:1 }}>保存配置</Button>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Typography variant="subtitle2" fontWeight={600} mb={1}>Page 12 · Salt-dependent phase behaviour</Typography>
                    {[1,2,3].map(i=>(
                      <Paper key={i} sx={{ p:2,mb:1.5,borderLeft:"4px solid",borderLeftColor:i===1?"primary.main":i===2?"warning.main":"success.main" }}>
                        <Typography variant="caption" fontWeight={700}>CHUNK-0{i+127} · child</Typography>
                        <Typography variant="body2" color="text.secondary" fontSize={12} mt={0.5}>At low salt concentrations, anion binding dominates the protein surface interaction...</Typography>
                      </Paper>
                    ))}
                  </Grid>
                </Grid>
              )}
              {!["documents","chunking"].includes(activeStage) && (
                <Box sx={{ p:4,textAlign:"center" }}><Typography variant="body2" color="text.secondary">「{STAGES.find(s=>s.id===activeStage)?.label}」模块开发中</Typography></Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
