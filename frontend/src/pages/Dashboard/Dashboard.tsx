import { Box, Typography, Card, CardContent, Grid, Button, Chip, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { Play, Search, ArrowRight } from "lucide-react";

const metrics = [
  { label: "最新评测得分", value: "82.4", sub: "↑ 4.8 vs baseline", color: "success.main" },
  { label: "回归通过率", value: "94.6%", sub: "742 / 781 cases" },
  { label: "待处理 Bad Case", value: "7", sub: "2 个命中致命错误", color: "error.main" },
  { label: "P95 延迟", value: "2.18s", sub: "↓ 180ms" },
  { label: "今日 Trace", value: "8,420", sub: "10 QPS 峰值" },
];

export default function Dashboard() {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography variant="h1">工作台</Typography>
          <Typography variant="body2" color="text.secondary">Research RAG · 生产环境今日状态</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" startIcon={<Search size={16} />}>查找 Trace</Button>
          <Button variant="contained" startIcon={<Play size={16} />}>新建评测</Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {metrics.map((m) => (
          <Grid item xs={6} sm={4} md={2.4} key={m.label}>
            <Card>
              <CardContent sx={{ py: 2.5, px: 3 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{m.label}</Typography>
                <Typography variant="h4" fontWeight={600} mt={1} color={m.color}>{m.value}</Typography>
                <Typography variant="caption" color="text.secondary" mt={0.5}>{m.sub}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h3">最近评测</Typography>
                <Button size="small" endIcon={<ArrowRight size={14} />}>查看全部</Button>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>评测任务</TableCell><TableCell>数据集</TableCell>
                    <TableCell>版本</TableCell><TableCell>得分</TableCell>
                    <TableCell>状态</TableCell><TableCell>时间</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <TableCell><strong>exp-028 · hybrid rerank</strong><br /><Typography variant="caption">run_01JZ8H2Q</Typography></TableCell>
                    <TableCell>PSQA 581</TableCell><TableCell>v2.4.0</TableCell>
                    <TableCell><strong>82.4</strong></TableCell>
                    <TableCell><Chip label="已通过" color="success" size="small" /></TableCell>
                    <TableCell>18 分钟前</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h3" mb={2}>需要关注</Typography>
              <Chip label="7 项" color="error" size="small" sx={{ mb: 2 }} />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {["2 个 Case 命中致命错误", "Rerank P95 上升 18%", "知识库有 4 份文档待重试"].map((item, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: i === 0 ? "error.50" : "warning.50", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CircleAlert size={16} color={i === 0 ? "#f44336" : "#ff9800"} />
                    </Box>
                    <Box sx={{ flex: 1 }}><Typography variant="body2" fontWeight={500}>{item}</Typography></Box>
                    <ArrowRight size={14} />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function CircleAlert(props: any) { return <svg {...props} />; }
