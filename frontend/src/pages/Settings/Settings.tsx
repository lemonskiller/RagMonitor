import { Box, Typography, Card, CardContent, Button, Chip, Grid, TextField, Select, MenuItem, Switch } from "@mui/material";
import { Send, RotateCw } from "lucide-react";

export default function Settings() {
  return (<Box>
    <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",mb:2.5}}>
      <Box><Typography variant="h1">应用接入</Typography><Typography variant="body2" color="text.secondary">配置 Python SDK、Trace API 凭证与上报策略</Typography></Box>
      <Button variant="contained" size="small" startIcon={<Send size={14}/>}>发送测试 Trace</Button>
    </Box>
    <Grid container spacing={2}>
      <Grid item xs={12} md={7}><Card><CardContent>
        <Box sx={{display:"flex",alignItems:"center",gap:1,mb:2}}><Typography variant="h3">Python SDK</Typography><Chip label="已接入" color="success" size="small"/></Box>
        <Box sx={{mb:2}}><Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>Trace Endpoint</Typography>
          <TextField fullWidth size="small" value="https://api.ragscope.example/v1/traces" InputProps={{readOnly:true}}/></Box>
        <Box sx={{mb:2}}><Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>API Key</Typography>
          <Box sx={{display:"flex",gap:1}}><TextField fullWidth size="small" value="rsk_prod_••••••••a29f" InputProps={{readOnly:true}}/><Button variant="outlined" size="small" startIcon={<RotateCw size={12}/>}>轮换</Button></Box></Box>
        <Box sx={{p:2,bgcolor:"#1e1e1e",borderRadius:2,fontFamily:"monospace",fontSize:11,color:"#e8eaed",lineHeight:1.8}}>
          <span style={{color:"#c792ea"}}>from</span> ragscope <span style={{color:"#c792ea"}}>import</span> Client<br/>
          client = Client(api_key=<span style={{color:"#89ddff"}}>&quot;$RAGSCOPE_API_KEY&quot;</span>)<br/>
          <span style={{color:"#c792ea"}}>with</span> client.trace(name=<span style={{color:"#89ddff"}}>&quot;rag.query&quot;</span>) <span style={{color:"#c792ea"}}>as</span> trace:<br/>
          &nbsp;&nbsp;trace.span(<span style={{color:"#89ddff"}}>&quot;retrieval&quot;</span>, input={'{'}&quot;query&quot;: query{'}'})<br/>
          &nbsp;&nbsp;trace.set_output({'{'}&quot;answer&quot;: answer{'}'})
        </Box></CardContent></Card></Grid>
      <Grid item xs={12} md={5}><Card><CardContent>
        <Typography variant="h3" mb={2}>上报策略</Typography>
        <Box sx={{mb:2}}><Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>内容级别</Typography><Select size="small" fullWidth defaultValue="full"><MenuItem value="full">完整内容（默认）</MenuItem></Select></Box>
        <Box sx={{mb:2}}><Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>采样率 <Box component="span" fontFamily="monospace" fontWeight={700}>100%</Box></Typography><Box sx={{height:4,bgcolor:"primary.main",borderRadius:2,width:"100%"}}/></Box>
        {["异步批量上报","错误 Trace 强制上报","高延迟 Trace 强制上报"].map((t,i)=>(<Box key={i} sx={{display:"flex",justifyContent:"space-between",alignItems:"center",py:1,borderBottom:"1px solid",borderColor:"divider"}}><Typography variant="body2">{t}</Typography><Switch defaultChecked size="small"/></Box>))}
      </CardContent></Card></Grid>
    </Grid>
  </Box>);
}
