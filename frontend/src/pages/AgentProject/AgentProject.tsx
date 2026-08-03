import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  Archive,
  ArrowDown,
  BookOpenText,
  Boxes,
  CheckCircle2,
  CircleAlert,
  Container,
  Database,
  Download,
  FileCode2,
  FileText,
  FolderGit2,
  GitFork,
  HardDrive,
  Network,
  RefreshCw,
  Search,
  ServerCog,
  Sparkles,
} from "lucide-react";

type ViewId = "overview" | "retrieval" | "files" | "resources" | "skills" | "databases" | "runtime" | "prompts";

type PhaseFile = {
  name: string;
  relativePath: string;
  exists: boolean;
  sizeBytes: number | null;
  size: string;
  modifiedAt: number | null;
  sha256?: string;
  declaredSize?: string;
  verifiedSize?: boolean;
  id?: string;
};

type SourceCount = { name: string; count: number };

type SkillEntry = {
  id: string;
  name: string;
  kind: "skill" | "node" | "leaf";
  path: string;
  parent: string;
  description: string;
  toolType: string;
  primaryTool: string;
  permissionRequirements: string[];
  requiredSetup: string;
  nodes: number;
  leaves: number;
  supportFiles: number;
  excerpt: string;
};

type DatabaseInfo = {
  vectorStore: {
    type: string;
    engine: string;
    isFaiss: boolean;
    isMilvus: boolean;
    compressedArchive: PhaseFile;
    declaredFiles: PhaseFile[];
    documentCatalog: { size: string; sha256: string };
    markdownDirectoryCount: number;
    apiEnriched: { size: string; sha256: string };
  };
  sdb: {
    type: string;
    engine: string;
    compressedArchive: PhaseFile;
    sqliteFile: { path: string; exists: boolean; sizeBytes: number | null; size: string };
    tables: Array<{ name: string; type: string }>;
    tableCounts: Array<{ table: string; rows: number }>;
    sampleRecords: Array<Record<string, string | number | null>>;
  };
};

type PhaseAgentProject = {
  rootPath: string;
  rootExists: boolean;
  product: string;
  releaseVersion: string;
  distributionScope: string;
  createdAt: string;
  releaseCreatedAt: string;
  notice: string;
  excluded: string[];
  files: PhaseFile[];
  mainFiles: PhaseFile[];
  readme: string;
  envExample: string;
  sha256Sums: string;
  image: { name: string; imageId: string; archive: PhaseFile };
  releaseBundle: PhaseFile;
  resourcePacks: PhaseFile[];
  skills: {
    path: string;
    tree_sha256: string;
    file_count: number;
    skill_md: number;
    node_md: number;
    leaf_md: number;
    frozen: boolean;
  };
  commands: { default: string; supported: string[] };
  workspace: { default: string; container_target: string; write_mode: string };
  eb: Record<string, string | string[] | boolean>;
  sdbQuality: Record<string, number | string>;
  sourceCounts: SourceCount[];
  vectorFiles: PhaseFile[];
  documentCatalog: { size: string; sha256: string };
  apiEnriched: { size: string; sha256: string };
  markdownDirectoryCount: number;
  skillEntries: SkillEntry[];
  databases: DatabaseInfo;
};

const PANEL_SX = { border: "1px solid", borderColor: "divider", boxShadow: "none", overflow: "hidden" };
const MONO_SX = { fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace' };
const API_BASE = new URL("api/", window.location.origin + import.meta.env.BASE_URL).toString();

const VIEW_TABS: Array<{ id: ViewId; label: string; icon: typeof Network }> = [
  { id: "overview", label: "真实概览", icon: Network },
  { id: "retrieval", label: "召回链路", icon: GitFork },
  { id: "files", label: "交接文件", icon: FileText },
  { id: "resources", label: "资源包", icon: Database },
  { id: "skills", label: "Skills", icon: Boxes },
  { id: "databases", label: "数据库", icon: Database },
  { id: "runtime", label: "Runtime", icon: Container },
  { id: "prompts", label: "README / Env", icon: FileCode2 },
];

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Box sx={{ p: 2, minWidth: 0, borderRight: { md: "1px solid" }, borderBottom: { xs: "1px solid", md: 0 }, borderColor: "divider" }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={800} sx={{ mt: 0.5, overflowWrap: "anywhere" }}>{value}</Typography>
    </Box>
  );
}

function MetricGrid({ children }: { children: React.ReactNode }) {
  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(5, minmax(0, 1fr))" } }}>{children}</Box>;
}

function FileTable({ files }: { files: PhaseFile[] }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>{["文件", "实际大小", "状态", "SHA256 / 说明"].map((heading) => <TableCell key={heading} sx={{ fontSize: 10, fontWeight: 800 }}>{heading}</TableCell>)}</TableRow>
        </TableHead>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.relativePath}>
              <TableCell sx={{ ...MONO_SX, fontSize: 11, overflowWrap: "anywhere" }}>{file.relativePath}</TableCell>
              <TableCell sx={{ ...MONO_SX, fontSize: 11 }}>{file.size}</TableCell>
              <TableCell><Chip size="small" color={file.exists ? "success" : "error"} label={file.exists ? "exists" : "missing"} /></TableCell>
              <TableCell sx={{ ...MONO_SX, fontSize: 10, maxWidth: 360, overflowWrap: "anywhere" }}>{file.sha256 || (file.verifiedSize === false ? "declared size mismatch" : file.declaredSize || "-")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function SourceBars({ rows }: { rows: SourceCount[] }) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  return (
    <Stack spacing={1.3}>
      {rows.slice(0, 10).map((row) => (
        <Box key={row.name} sx={{ display: "grid", gridTemplateColumns: "110px 1fr 72px", gap: 1, alignItems: "center" }}>
          <Typography variant="caption" fontWeight={700}>{row.name}</Typography>
          <LinearProgress variant="determinate" value={(row.count / max) * 100} sx={{ height: 6, borderRadius: 3 }} />
          <Typography variant="caption" textAlign="right" fontWeight={800} sx={MONO_SX}>{row.count.toLocaleString()}</Typography>
        </Box>
      ))}
    </Stack>
  );
}

function Overview({ project }: { project: PhaseAgentProject }) {
  return (
    <Stack spacing={2}>
      <Card sx={PANEL_SX}>
        <MetricGrid>
          <Metric label="Product / Release" value={`${project.product} ${project.releaseVersion}`} />
          <Metric label="Scope" value={project.distributionScope} />
          <Metric label="Handoff files" value={project.files.length} />
          <Metric label="Skills" value={`${project.skills.skill_md} roots / ${project.skills.file_count} files`} />
          <Metric label="SDB records" value={Number(project.sdbQuality.record_count || 0).toLocaleString()} />
        </MetricGrid>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ ...PANEL_SX, height: "100%" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                <FolderGit2 size={18} />
                <Typography variant="h3">实时读取目录</Typography>
                <Chip size="small" color={project.rootExists ? "success" : "error"} label={project.rootExists ? "readable" : "missing"} />
              </Stack>
              <Typography variant="body2" sx={{ ...MONO_SX, overflowWrap: "anywhere" }}>{project.rootPath}</Typography>
              <Alert severity="info" sx={{ mt: 2, fontSize: 12 }}>{project.notice}</Alert>
              <Box component="pre" sx={{ ...MONO_SX, mt: 2, mb: 0, p: 2, bgcolor: "#14161b", color: "#d9e0e8", borderRadius: 1.5, fontSize: 11, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {project.readme}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card sx={{ ...PANEL_SX, height: "100%" }}>
            <CardContent>
              <Typography variant="h3" mb={1.5}>交接边界</Typography>
              {project.excluded.map((item) => (
                <Box key={item} sx={{ display: "flex", alignItems: "center", gap: 1, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                  <CircleAlert size={15} />
                  <Typography variant="caption">{item}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">release manifest</Typography>
              <Typography variant="body2" fontWeight={700} sx={MONO_SX}>{project.releaseCreatedAt}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

function Resources({ project }: { project: PhaseAgentProject }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={8}>
        <Card sx={PANEL_SX}>
          <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography variant="h3">真实资源包文件</Typography>
            <Chip label={`${project.resourcePacks.length} packs`} size="small" />
          </Box>
          <FileTable files={[project.image.archive, project.releaseBundle, ...project.resourcePacks]} />
        </Card>
      </Grid>
      <Grid item xs={12} lg={4}>
        <Card sx={{ ...PANEL_SX, height: "100%" }}>
          <CardContent>
            <Typography variant="h3" mb={1.5}>EB / Vector DB Manifest</Typography>
            <MetricGrid>
              <Metric label="Markdown" value={project.markdownDirectoryCount.toLocaleString()} />
              <Metric label="Catalog" value={project.documentCatalog.size} />
              <Metric label="API enriched" value={project.apiEnriched.size} />
              <Metric label="DB files" value={project.vectorFiles.length} />
              <Metric label="Fingerprint" value="verified" />
            </MetricGrid>
            <Divider sx={{ my: 2 }} />
            <FileTable files={project.vectorFiles} />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function SkillsView({ project }: { project: PhaseAgentProject }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [selectedId, setSelectedId] = useState(project.skillEntries[0]?.id || "");
  const visibleSkills = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return project.skillEntries.filter((entry) => {
      const kindMatch = kind === "all" || entry.kind === kind;
      const text = `${entry.name} ${entry.description} ${entry.path} ${entry.primaryTool} ${entry.permissionRequirements.join(" ")}`.toLowerCase();
      return kindMatch && (!normalized || text.includes(normalized));
    });
  }, [kind, project.skillEntries, query]);
  const selected = project.skillEntries.find((entry) => entry.id === selectedId) || visibleSkills[0] || project.skillEntries[0];

  return (
    <Stack spacing={2}>
      <Card sx={PANEL_SX}>
        <CardContent>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} alignItems={{ xs: "stretch", lg: "center" }} justifyContent="space-between" mb={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Boxes size={19} />
              <Box>
                <Typography variant="h3">全量 Skills / Nodes / Leaves</Typography>
                <Typography variant="caption" color="text.secondary">从 release bundle 中真实解析 `SKILL.md`、`NODE.md`、`LEAF.md`</Typography>
              </Box>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ minWidth: { lg: 520 } }}>
              <TextField
                size="small"
                fullWidth
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索 skill 名称、功能、工具、权限"
                InputProps={{ startAdornment: <InputAdornment position="start"><Search size={15} /></InputAdornment> }}
              />
              <Select size="small" value={kind} onChange={(event) => setKind(event.target.value)} sx={{ minWidth: 130 }}>
                <MenuItem value="all">全部</MenuItem>
                <MenuItem value="skill">Skill</MenuItem>
                <MenuItem value="node">Node</MenuItem>
                <MenuItem value="leaf">Leaf</MenuItem>
              </Select>
            </Stack>
          </Stack>

          <MetricGrid>
            <Metric label="解析条目" value={project.skillEntries.length.toLocaleString()} />
            <Metric label="SKILL.md" value={project.skills.skill_md} />
            <Metric label="NODE.md" value={project.skills.node_md} />
            <Metric label="LEAF.md" value={project.skills.leaf_md} />
            <Metric label="当前结果" value={visibleSkills.length.toLocaleString()} />
          </MetricGrid>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Card sx={PANEL_SX}>
            <TableContainer sx={{ maxHeight: 520 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>{["类型", "名称", "功能", "工具", "权限要求"].map((heading) => <TableCell key={heading} sx={{ fontSize: 10, fontWeight: 800 }}>{heading}</TableCell>)}</TableRow>
                </TableHead>
                <TableBody>
                  {visibleSkills.map((entry) => (
                    <TableRow
                      key={entry.id}
                      hover
                      selected={selected?.id === entry.id}
                      onClick={() => setSelectedId(entry.id)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell><Chip size="small" label={entry.kind} color={entry.kind === "skill" ? "primary" : entry.kind === "node" ? "info" : "default"} /></TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        <Typography variant="body2" fontWeight={800}>{entry.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ ...MONO_SX, overflowWrap: "anywhere" }}>{entry.path}</Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 320, fontSize: 11, lineHeight: 1.65 }}>{entry.description || "-"}</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        <Typography variant="caption" fontWeight={700}>{entry.primaryTool || "-"}</Typography>
                        {entry.toolType && <Typography variant="caption" color="text.secondary" display="block">{entry.toolType}</Typography>}
                      </TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Stack spacing={0.5}>
                          {entry.permissionRequirements.slice(0, 2).map((item) => <Typography key={item} variant="caption" color="text.secondary">{item}</Typography>)}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Card sx={{ ...PANEL_SX, height: "100%" }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="h3">{selected?.name || "未选择 Skill"}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ...MONO_SX, overflowWrap: "anywhere" }}>{selected?.path}</Typography>
            </Box>
            {selected && (
              <CardContent>
                <Stack direction="row" spacing={1} flexWrap="wrap" mb={1.5}>
                  <Chip size="small" label={selected.kind} color={selected.kind === "skill" ? "primary" : "default"} />
                  {selected.primaryTool && <Chip size="small" label={selected.primaryTool} variant="outlined" />}
                  {selected.toolType && <Chip size="small" label={selected.toolType} variant="outlined" />}
                  {selected.kind === "skill" && <Chip size="small" label={`${selected.nodes} nodes / ${selected.leaves} leaves`} variant="outlined" />}
                </Stack>
                <Typography variant="body2" sx={{ lineHeight: 1.8 }}>{selected.description}</Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" fontWeight={800}>权限 / 环境要求</Typography>
                <Stack spacing={1} mt={1}>
                  {selected.permissionRequirements.map((item) => <Alert key={item} severity={item.startsWith("No explicit") ? "info" : "warning"} sx={{ fontSize: 12 }}>{item}</Alert>)}
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" fontWeight={800}>文件摘录</Typography>
                <Box component="pre" sx={{ ...MONO_SX, mt: 1, mb: 0, p: 2, bgcolor: "#14161b", color: "#d9e0e8", borderRadius: 1.5, fontSize: 11, lineHeight: 1.7, whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxHeight: 360, overflowY: "auto" }}>{selected.excerpt}</Box>
              </CardContent>
            )}
          </Card>
        </Grid>
      </Grid>

    </Stack>
  );
}

function DatabasesView({ project, loading, onResample }: { project: PhaseAgentProject; loading: boolean; onResample: () => void }) {
  const ebPack = project.resourcePacks.find((pack) => pack.id === "eb");
  const sdbPack = project.resourcePacks.find((pack) => pack.id === "sdb_v2");
  const vectorSize = project.databases.vectorStore.compressedArchive.size !== "-"
    ? project.databases.vectorStore.compressedArchive.size
    : ebPack?.declaredSize || "-";
  const sdbArchiveSize = project.databases.sdb.compressedArchive.size !== "-"
    ? project.databases.sdb.compressedArchive.size
    : sdbPack?.declaredSize || "-";
  const sqliteSize = project.databases.sdb.sqliteFile.size;
  const samples = project.databases.sdb.sampleRecords;

  return (
    <Stack spacing={2}>
      <Card sx={PANEL_SX}>
        <MetricGrid>
          <Metric label="数据库资产" value="2" />
          <Metric label="EB 向量库归档" value={vectorSize} />
          <Metric label="SDB 归档" value={sdbArchiveSize} />
          <Metric label="SDB SQLite 实际大小" value={sqliteSize !== "-" ? sqliteSize : "未解压"} />
          <Metric label="SDB 记录数" value={Number(project.sdbQuality.record_count || 0).toLocaleString()} />
        </MetricGrid>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Card sx={{ ...PANEL_SX, height: "100%" }}>
            <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, borderBottom: "1px solid", borderColor: "divider" }}>
              <Box>
                <Typography variant="h3">数据库清单</Typography>
                <Typography variant="caption" color="text.secondary">项目交接清单与可读取缓存中的数据库资产</Typography>
              </Box>
              <Chip size="small" label="2 databases" color="primary" />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>{["数据库", "类型 / 引擎", "存储位置", "大小", "当前能力"].map((heading) => <TableCell key={heading} sx={{ fontSize: 10, fontWeight: 800 }}>{heading}</TableCell>)}</TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ minWidth: 170 }}><Typography variant="body2" fontWeight={800}>Evidence Base</Typography><Typography variant="caption" color="text.secondary">EB Vector Store</Typography></TableCell>
                    <TableCell sx={{ minWidth: 180, fontSize: 11 }}>{project.databases.vectorStore.type}</TableCell>
                    <TableCell sx={{ ...MONO_SX, minWidth: 150, fontSize: 10 }}>/mnt/vector-db</TableCell>
                    <TableCell sx={{ ...MONO_SX, fontSize: 11, whiteSpace: "nowrap" }}>{vectorSize}</TableCell>
                    <TableCell><Chip size="small" label="需挂载 Runtime" variant="outlined" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><Typography variant="body2" fontWeight={800}>Source DB v2</Typography><Typography variant="caption" color="text.secondary">SDB</Typography></TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{project.databases.sdb.engine}</TableCell>
                    <TableCell sx={{ ...MONO_SX, maxWidth: 240, fontSize: 10, overflowWrap: "anywhere" }}>{project.databases.sdb.sqliteFile.path}</TableCell>
                    <TableCell sx={{ ...MONO_SX, fontSize: 11, whiteSpace: "nowrap" }}>{sqliteSize !== "-" ? sqliteSize : sdbArchiveSize}</TableCell>
                    <TableCell><Chip size="small" label={project.databases.sdb.sqliteFile.exists ? "可查询 / 可抽样" : "仅清单可见"} color={project.databases.sdb.sqliteFile.exists ? "success" : "default"} /></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card sx={{ ...PANEL_SX, height: "100%" }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="h3">数据库文件与大小</Typography>
              <Typography variant="caption" color="text.secondary">EB 清单声明文件及 SDB 解压后的 SQLite 文件</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell sx={{ fontSize: 10, fontWeight: 800 }}>文件</TableCell><TableCell sx={{ fontSize: 10, fontWeight: 800 }}>所属库</TableCell><TableCell align="right" sx={{ fontSize: 10, fontWeight: 800 }}>大小</TableCell></TableRow></TableHead>
                <TableBody>
                  {project.databases.vectorStore.declaredFiles.map((file) => (
                    <TableRow key={file.name}>
                      <TableCell sx={{ ...MONO_SX, fontSize: 10 }}>{file.name}</TableCell>
                      <TableCell><Chip size="small" label="EB" variant="outlined" /></TableCell>
                      <TableCell align="right" sx={{ ...MONO_SX, fontSize: 10 }}>{file.size}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell sx={{ ...MONO_SX, fontSize: 10 }}>source_db_index.sqlite3</TableCell>
                    <TableCell><Chip size="small" label="SDB" variant="outlined" /></TableCell>
                    <TableCell align="right" sx={{ ...MONO_SX, fontSize: 10 }}>{sqliteSize !== "-" ? sqliteSize : "未解压"}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <Alert severity="info" sx={{ m: 2, fontSize: 12 }}>{project.databases.vectorStore.engine}</Alert>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={4}>
          <Card sx={{ ...PANEL_SX, height: "100%" }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="h3">SDB 表数据量</Typography>
              <Typography variant="caption" color="text.secondary">SQLite tables / views</Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 420 }}>
              <Table size="small" stickyHeader>
                <TableHead><TableRow><TableCell sx={{ fontSize: 10, fontWeight: 800 }}>表 / 视图</TableCell><TableCell align="right" sx={{ fontSize: 10, fontWeight: 800 }}>记录数</TableCell></TableRow></TableHead>
                <TableBody>
                  {project.databases.sdb.tableCounts.map((row) => (
                    <TableRow key={row.table}>
                      <TableCell sx={{ ...MONO_SX, fontSize: 11 }}>{row.table}</TableCell>
                      <TableCell align="right" sx={{ ...MONO_SX, fontSize: 11 }}>{row.rows.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card sx={PANEL_SX}>
            <Box sx={{ px: 2, py: 1.5, display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between", gap: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
              <Box>
                <Typography variant="h3">抽样数据内容</Typography>
                <Typography variant="caption" color="text.secondary">从 SDB SQLite 的 `records` 表只读随机抽样 10 条</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Select size="small" defaultValue="sdb" inputProps={{ "aria-label": "抽样数据库" }} sx={{ minWidth: 170 }}>
                  <MenuItem value="sdb">Source DB v2</MenuItem>
                  <MenuItem value="vector" disabled>EB Vector（需挂载）</MenuItem>
                </Select>
                <Button variant="outlined" size="small" disabled={loading} startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <RefreshCw size={14} />} onClick={onResample}>
                  {loading ? "抽样中" : "重新抽样"}
                </Button>
              </Stack>
            </Box>
            {samples.length > 0 ? (
              <TableContainer sx={{ maxHeight: 460 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>{["record_id", "source", "entity", "primary_name", "gene", "organism", "evidence", "description"].map((heading) => <TableCell key={heading} sx={{ ...MONO_SX, fontSize: 10, fontWeight: 800 }}>{heading}</TableCell>)}</TableRow>
                  </TableHead>
                  <TableBody>
                    {samples.map((row) => (
                      <TableRow key={String(row.record_id)} hover>
                        <TableCell sx={{ ...MONO_SX, fontSize: 10, maxWidth: 180, overflowWrap: "anywhere" }}>{String(row.record_id || "")}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{String(row.source_database || "")}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{String(row.entity_type || "")}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{String(row.primary_name || "")}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{String(row.gene_name || "")}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{String(row.organism || "")}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{String(row.evidence_class || "")}</TableCell>
                        <TableCell sx={{ fontSize: 11, minWidth: 280, lineHeight: 1.55 }}>{String(row.description || "")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ px: 2, py: 5, textAlign: "center" }}>
                <Typography variant="body2" fontWeight={700}>当前没有可抽样记录</Typography>
                <Typography variant="caption" color="text.secondary">确认 SDB SQLite 已解压并配置到服务端路径</Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      <Card sx={PANEL_SX}>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
            <Database size={18} />
            <Typography variant="h3">SDB v2 来源分布</Typography>
            <Chip label={String(project.sdbQuality.integrity_check || "unknown")} color="success" size="small" />
          </Stack>
          <MetricGrid>
            <Metric label="Records" value={Number(project.sdbQuality.record_count || 0).toLocaleString()} />
            <Metric label="Unique IDs" value={Number(project.sdbQuality.unique_record_ids || 0).toLocaleString()} />
            <Metric label="Sources" value={String(project.sdbQuality.source_count || "-")} />
            <Metric label="Aliases" value={Number(project.sdbQuality.alias_count || 0).toLocaleString()} />
            <Metric label="Missing IDs" value={String(project.sdbQuality.missing_canonical_id ?? "-")} />
          </MetricGrid>
          <Divider sx={{ my: 2 }} />
          <SourceBars rows={project.sourceCounts} />
        </CardContent>
      </Card>
    </Stack>
  );
}

type PipelineNodeProps = {
  step: string;
  title: string;
  subtitle: string;
  status: "ready" | "declared" | "planned";
  children: React.ReactNode;
};

function PipelineNode({ step, title, subtitle, status, children }: PipelineNodeProps) {
  const statusMap = {
    ready: { label: "可查询", color: "success" as const },
    declared: { label: "已声明", color: "info" as const },
    planned: { label: "待接入", color: "default" as const },
  };
  const state = statusMap[status];
  return (
    <Card sx={{ ...PANEL_SX, height: "100%", borderColor: status === "planned" ? "divider" : "primary.light" }}>
      <Box sx={{ px: 2, py: 1.4, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, borderBottom: "1px solid", borderColor: "divider" }}>
        <Stack direction="row" spacing={1.25} minWidth={0}>
          <Box sx={{ ...MONO_SX, width: 26, height: 26, flex: "0 0 26px", display: "grid", placeItems: "center", border: "1px solid", borderColor: "divider", borderRadius: 1, fontSize: 10, fontWeight: 800 }}>{step}</Box>
          <Box minWidth={0}>
            <Typography variant="body2" fontWeight={800}>{title}</Typography>
            <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
          </Box>
        </Stack>
        <Chip size="small" label={state.label} color={state.color} variant={status === "planned" ? "outlined" : "filled"} />
      </Box>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>{children}</CardContent>
    </Card>
  );
}

function PipelineConnector({ label }: { label?: string }) {
  return (
    <Box aria-hidden="true" sx={{ height: 38, display: "flex", alignItems: "center", justifyContent: "center", gap: 1, color: "text.secondary" }}>
      <Box sx={{ width: "1px", height: 16, bgcolor: "divider" }} />
      <ArrowDown size={15} />
      {label && <Typography variant="caption" sx={{ ...MONO_SX, fontSize: 10 }}>{label}</Typography>}
    </Box>
  );
}

function OutputLine({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "104px minmax(0, 1fr)", gap: 1.25, py: 0.65, borderBottom: "1px solid", borderColor: "divider", "&:last-child": { borderBottom: 0 } }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="caption" fontWeight={accent ? 800 : 600} sx={{ ...MONO_SX, overflowWrap: "anywhere", color: accent ? "primary.dark" : "text.primary" }}>{value}</Typography>
    </Box>
  );
}

function RetrievalPipeline({ project }: { project: PhaseAgentProject }) {
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [expansionEnabled, setExpansionEnabled] = useState(true);
  const [denseEnabled, setDenseEnabled] = useState(true);
  const [keywordEnabled, setKeywordEnabled] = useState(true);
  const [fusionMethod, setFusionMethod] = useState("rrf");
  const [rerankerEnabled, setRerankerEnabled] = useState(true);
  const sdbAvailable = project.databases.sdb.sqliteFile.exists;

  return (
    <Stack spacing={2}>
      <Card sx={PANEL_SX}>
        <CardContent sx={{ py: 1.5, display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "stretch", md: "center" }, justifyContent: "space-between", gap: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <GitFork size={19} />
            <Box>
              <Typography variant="h3">Query 到最终证据的召回链路</Typography>
              <Typography variant="caption" color="text.secondary">目标配置视图 · 已接入能力与待接入模块分开标记</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip size="small" color="success" label="EB 已声明" />
            <Chip size="small" color={sdbAvailable ? "success" : "default"} variant={sdbAvailable ? "filled" : "outlined"} label={sdbAvailable ? "SDB 可查询" : "SDB 待挂载"} />
            <Chip size="small" variant="outlined" label="编排待接入 Trace" />
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ maxWidth: 1100, width: "100%", mx: "auto" }}>
        <PipelineNode step="01" title="原始 Query" subtitle="保留用户原始意图，作为改写和回退基线" status="planned">
          <TextField fullWidth size="small" defaultValue="FUS 蛋白与应激颗粒形成有什么关系？" InputProps={{ readOnly: true }} inputProps={{ "aria-label": "原始 Query 示例" }} />
          <Stack direction="row" spacing={0.75} mt={1.25} flexWrap="wrap">
            <Chip size="small" variant="outlined" label="trace.original_query" />
            <Chip size="small" variant="outlined" label="lang: zh-CN" />
          </Stack>
        </PipelineNode>

        <PipelineConnector label="memory context" />

        <PipelineNode step="02" title="Memory 检索" subtitle="召回用户偏好、会话事实与历史实体" status="planned">
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25}>
            <Box><Typography variant="caption" fontWeight={800}>启用 Memory 上下文</Typography><Typography variant="caption" color="text.secondary" display="block">仅把相关记忆送入 Query Rewrite</Typography></Box>
            <Switch checked={memoryEnabled} onChange={(event) => setMemoryEnabled(event.target.checked)} inputProps={{ "aria-label": "启用 Memory 上下文" }} />
          </Stack>
          <OutputLine label="检索范围" value="session · user profile · long-term facts" />
          <OutputLine label="Top K" value="5" />
          <OutputLine label="输出" value={memoryEnabled ? "memory_items[] + memory_score" : "disabled"} accent={memoryEnabled} />
        </PipelineNode>

        <PipelineConnector label="rewrite context" />

        <PipelineNode step="03" title="Query Rewrite / Expansion" subtitle="基于原始问题和 Memory 生成多路检索表达" status="planned">
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25}>
            <Typography variant="caption" fontWeight={800}>生成扩展 Query</Typography>
            <Switch checked={expansionEnabled} onChange={(event) => setExpansionEnabled(event.target.checked)} inputProps={{ "aria-label": "生成扩展 Query" }} />
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 1 }}>
            {[
              ["原始 Query", "FUS 蛋白与应激颗粒形成有什么关系？"],
              ["Memory 增强 Query", memoryEnabled ? "结合用户关注的 LLPS 机制，检索 FUS 与 stress granule 形成证据" : "Memory 未启用"],
              ["关键词 / 实体 Query", expansionEnabled ? "FUS OR TLS · stress granule · LLPS" : "Expansion 未启用"],
            ].map(([label, value]) => (
              <Box key={label} sx={{ p: 1.4, border: "1px solid", borderColor: "divider", borderRadius: 1.25, minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="caption" display="block" mt={0.6} fontWeight={700} sx={{ lineHeight: 1.6 }}>{value}</Typography>
              </Box>
            ))}
          </Box>
          <Stack direction="row" spacing={0.75} mt={1.25} flexWrap="wrap">
            <Chip size="small" variant="outlined" label="trace.rewritten_query" />
            <Chip size="small" variant="outlined" label="trace.expanded_queries[]" />
          </Stack>
        </PipelineNode>

        <PipelineConnector label="parallel fan-out" />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 2, position: "relative" }}>
          <PipelineNode step="04A" title="EB Dense Retrieval" subtitle="Embedding 双塔语义召回" status="declared">
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25}>
              <Typography variant="caption" fontWeight={800}>Dense 通道</Typography>
              <Switch checked={denseEnabled} onChange={(event) => setDenseEnabled(event.target.checked)} inputProps={{ "aria-label": "启用 Dense 召回" }} />
            </Stack>
            <OutputLine label="数据源" value="Evidence Base · /mnt/vector-db" />
            <OutputLine label="Embedding" value="Qwen3-VL-Embedding-2B" />
            <OutputLine label="Top K" value="50" />
            <OutputLine label="Trace" value="dense_score · dense_rank · chunk_id" accent />
          </PipelineNode>

          <PipelineNode step="04B" title="SDB FTS5 Keyword Retrieval" subtitle="关键词、实体与别名倒排召回" status={sdbAvailable ? "ready" : "declared"}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25}>
              <Typography variant="caption" fontWeight={800}>Keyword 通道</Typography>
              <Switch checked={keywordEnabled} onChange={(event) => setKeywordEnabled(event.target.checked)} inputProps={{ "aria-label": "启用关键词召回" }} />
            </Stack>
            <OutputLine label="数据源" value="Source DB v2 · SQLite FTS5" />
            <OutputLine label="查询表达式" value="FUS OR TLS · stress granule · LLPS" />
            <OutputLine label="Top K" value="50" />
            <OutputLine label="Trace" value="bm25_score · keyword_rank · record_id" accent />
          </PipelineNode>
        </Box>

        <PipelineConnector label="merge candidates" />

        <PipelineNode step="05" title="RRF 融合" subtitle="跨通道按排名融合，避免直接相加不同尺度的分数" status="planned">
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ xs: "stretch", sm: "center" }} mb={1.5}>
            <Select size="small" value={fusionMethod} onChange={(event) => setFusionMethod(event.target.value)} inputProps={{ "aria-label": "融合方法" }} sx={{ minWidth: 190 }}>
              <MenuItem value="rrf">RRF 排名融合</MenuItem>
              <MenuItem value="weighted">归一化加权</MenuItem>
            </Select>
            <Chip size="small" variant="outlined" label="k = 60" />
            <Chip size="small" variant="outlined" label={`输入通道 ${Number(denseEnabled) + Number(keywordEnabled)}`} />
          </Stack>
          <Box sx={{ ...MONO_SX, px: 1.5, py: 1.2, bgcolor: "action.hover", border: "1px solid", borderColor: "divider", borderRadius: 1.25, fontSize: 11, overflowWrap: "anywhere" }}>
            {fusionMethod === "rrf" ? "RRF(d) = Σ 1 / (60 + rank_i(d))" : "score(d) = w_dense × norm(dense) + w_keyword × norm(BM25)"}
          </Box>
          <OutputLine label="去重键" value="canonical_id → document_id → chunk_id" />
          <OutputLine label="输出" value="fused_candidates[100] · fused_score · fused_rank" accent />
        </PipelineNode>

        <PipelineConnector label="top candidates" />

        <PipelineNode step="06" title="Reranker" subtitle="对融合候选进行 Query-Document 相关性重排" status="planned">
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25}>
            <Box><Typography variant="caption" fontWeight={800}>Cross-Encoder 重排</Typography><Typography variant="caption" color="text.secondary" display="block">融合 Top 100 → 最终 Top 10</Typography></Box>
            <Switch checked={rerankerEnabled} onChange={(event) => setRerankerEnabled(event.target.checked)} inputProps={{ "aria-label": "启用 Reranker" }} />
          </Stack>
          <OutputLine label="模型" value="待配置" />
          <OutputLine label="输入" value="rewritten_query + candidate_text" />
          <OutputLine label="最终输出" value={rerankerEnabled ? "rerank_score · final_rank · evidence[10]" : "按 fused_rank 输出"} accent />
        </PipelineNode>
      </Box>

      <Card sx={PANEL_SX}>
        <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="h3">Trace 应记录的阶段数据</Typography>
          <Typography variant="caption" color="text.secondary">用于定位 Query 改写、召回、融合或重排中的质量损失</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow>{["阶段", "输入", "输出", "核心指标"].map((heading) => <TableCell key={heading} sx={{ fontSize: 10, fontWeight: 800 }}>{heading}</TableCell>)}</TableRow></TableHead>
            <TableBody>
              {[
                ["Memory", "original_query · user/session", "memory_items[]", "hit_count · score · latency_ms"],
                ["Rewrite", "query + memory", "rewritten/expanded queries", "rewrite_latency · fallback_reason"],
                ["Dense", "dense_query", "EB chunks", "dense_score · rank · latency_ms"],
                ["Keyword", "entity/keyword query", "SDB records", "BM25 score · rank · latency_ms"],
                ["Fusion", "all candidate lists", "fused candidates", "RRF score · fused_rank · duplicate_count"],
                ["Reranker", "query + candidates", "final evidence", "rerank_score · final_rank · latency_ms"],
              ].map((row) => <TableRow key={row[0]}>{row.map((cell, index) => <TableCell key={cell} sx={{ ...(index > 0 ? MONO_SX : {}), fontSize: index > 0 ? 10 : 11, fontWeight: index === 0 ? 800 : 500 }}>{cell}</TableCell>)}</TableRow>)}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Stack>
  );
}

function Runtime({ project }: { project: PhaseAgentProject }) {
  const runtimeRows = [
    ["Image", project.image.name],
    ["Image ID", project.image.imageId],
    ["Default command", project.commands.default],
    ["Commands", project.commands.supported.join(" · ")],
    ["Workspace", `${project.workspace.default} -> ${project.workspace.container_target}`],
    ["Write mode", project.workspace.write_mode],
  ];
  const ebRows = Object.entries(project.eb).filter(([, value]) => typeof value === "string" || Array.isArray(value));
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={7}>
        <Card sx={PANEL_SX}>
          <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}><Typography variant="h3">Runtime Contract</Typography></Box>
          <TableContainer>
            <Table size="small">
              <TableBody>{runtimeRows.map(([label, value]) => <TableRow key={label}><TableCell sx={{ fontSize: 11, fontWeight: 700 }}>{label}</TableCell><TableCell sx={{ ...MONO_SX, fontSize: 11, overflowWrap: "anywhere" }}>{value}</TableCell></TableRow>)}</TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>
      <Grid item xs={12} lg={5}>
        <Card sx={PANEL_SX}>
          <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}><Typography variant="h3">EB Service Targets</Typography></Box>
          <TableContainer>
            <Table size="small">
              <TableBody>{ebRows.map(([label, value]) => <TableRow key={label}><TableCell sx={{ fontSize: 11, fontWeight: 700 }}>{label}</TableCell><TableCell sx={{ ...MONO_SX, fontSize: 11, overflowWrap: "anywhere" }}>{Array.isArray(value) ? value.join(" / ") : value}</TableCell></TableRow>)}</TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>
    </Grid>
  );
}

function Prompts({ project }: { project: PhaseAgentProject }) {
  return (
    <Grid container spacing={2}>
      {[
        ["README.md", project.readme, BookOpenText],
        ["phaseagent.env.example", project.envExample, Sparkles],
        ["SHA256SUMS", project.sha256Sums, Archive],
      ].map(([title, content, Icon]) => (
        <Grid item xs={12} lg={4} key={String(title)}>
          <Card sx={{ ...PANEL_SX, height: "100%" }}>
            <Box sx={{ px: 2, py: 1.5, display: "flex", gap: 1, alignItems: "center", borderBottom: "1px solid", borderColor: "divider" }}>
              <Icon size={17} />
              <Typography variant="h3">{String(title)}</Typography>
            </Box>
            <Box component="pre" sx={{ ...MONO_SX, m: 0, p: 2, minHeight: 360, bgcolor: "#14161b", color: "#d9e0e8", fontSize: 11, lineHeight: 1.75, whiteSpace: "pre-wrap", overflowWrap: "anywhere", overflowY: "auto" }}>{String(content)}</Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function ProjectLoadingState({ refreshing }: { refreshing: boolean }) {
  if (refreshing) {
    return (
      <Card role="status" aria-live="polite" sx={{ ...PANEL_SX, mb: 2, position: "relative", borderColor: "primary.light" }}>
        <LinearProgress sx={{ position: "absolute", inset: "0 0 auto", height: 3 }} />
        <CardContent sx={{ py: 1.5, display: "flex", alignItems: "center", gap: 1.5, "&:last-child": { pb: 1.5 } }}>
          <CircularProgress size={22} thickness={4.5} />
          <Box>
            <Typography variant="body2" fontWeight={800}>正在重新扫描 PhaseAgent</Typography>
            <Typography variant="caption" color="text.secondary">已有数据仍可查看，扫描完成后会自动更新</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card role="status" aria-live="polite" sx={{ ...PANEL_SX, position: "relative" }}>
      <LinearProgress sx={{ position: "absolute", inset: "0 0 auto", height: 3 }} />
      <CardContent sx={{ p: { xs: 2, sm: 3 }, "&:last-child": { pb: { xs: 2, sm: 3 } } }}>
        <Stack direction="row" alignItems="center" spacing={1.75} mb={3}>
          <Box sx={{ width: 44, height: 44, flex: "0 0 44px", display: "grid", placeItems: "center", border: "1px solid", borderColor: "primary.light", borderRadius: 1.5, bgcolor: "action.hover" }}>
            <CircularProgress size={24} thickness={4.5} />
          </Box>
          <Box minWidth={0}>
            <Typography variant="h3">正在读取 PhaseAgent 项目</Typography>
            <Typography variant="caption" color="text.secondary">扫描 manifest、资源包、Skills、数据库与 Runtime，请稍候</Typography>
          </Box>
        </Stack>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
          {[0, 1, 2].map((item) => (
            <Box key={item} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
              <Skeleton variant="text" animation="wave" width="42%" height={18} />
              <Skeleton variant="text" animation="wave" width="74%" height={30} />
              <Skeleton variant="rounded" animation="wave" height={56} sx={{ mt: 1 }} />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function AgentProject() {
  const [activeView, setActiveView] = useState<ViewId>("overview");
  const [project, setProject] = useState<PhaseAgentProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadProject = async (announce = true) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}phaseagent/project`, { cache: "no-store" });
      if (!response.ok) throw new Error(`API ${response.status}`);
      const data = (await response.json()) as PhaseAgentProject;
      setProject(data);
      if (announce) setMessage("已重新扫描 PhaseAgent 交接目录");
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "读取 PhaseAgent 项目失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProject(false);
  }, []);

  const page = useMemo(() => {
    if (!project) return null;
    if (activeView === "overview") return <Overview project={project} />;
    if (activeView === "retrieval") return <RetrievalPipeline project={project} />;
    if (activeView === "files") return <Card sx={PANEL_SX}><FileTable files={project.mainFiles} /></Card>;
    if (activeView === "resources") return <Resources project={project} />;
    if (activeView === "skills") return <SkillsView project={project} />;
    if (activeView === "databases") return <DatabasesView project={project} loading={loading} onResample={() => void loadProject()} />;
    if (activeView === "runtime") return <Runtime project={project} />;
    return <Prompts project={project} />;
  }, [activeView, loading, project]);

  return (
    <Box aria-busy={loading} sx={{ minWidth: 0 }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "flex-start" }, gap: 2, mb: 2.5 }}>
        <Box>
          <Typography variant="h1">PhaseAgent 项目</Typography>
          <Typography variant="body2" color="text.secondary">从真实 handoff 目录实时读取 manifest、资源包、Skills、SDB 与 Runtime 信息</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button fullWidth variant="outlined" size="small" disabled={!project || loading} startIcon={<Download size={14} />} onClick={() => setMessage("当前视图来自实时 API，可直接保存页面快照")}>导出快照</Button>
          <Button fullWidth variant="contained" size="small" disabled={loading} startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <RefreshCw size={14} />} onClick={() => void loadProject()}>
            {loading ? "扫描中" : "重新扫描"}
          </Button>
        </Stack>
      </Box>

      {loading && <ProjectLoadingState refreshing={Boolean(project)} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>PhaseAgent API 读取失败：{error}</Alert>}

      {project && (
        <>
          <Card sx={{ ...PANEL_SX, mb: 2 }}>
            <CardContent sx={{ py: 1.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", "&:last-child": { pb: 1.5 } }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mr: 0.5 }}>
                <FolderGit2 size={17} />
                <Typography variant="body2" fontWeight={800} sx={{ ...MONO_SX, overflowWrap: "anywhere" }}>{project.rootPath}</Typography>
              </Stack>
              <Chip icon={<CheckCircle2 size={13} />} label={`${project.files.length} 个真实文件`} size="small" color="success" />
              <Chip icon={<HardDrive size={13} />} label={project.image.archive.size} size="small" color="primary" />
              <Chip icon={<ServerCog size={13} />} label={`SDB ${Number(project.sdbQuality.record_count || 0).toLocaleString()} records`} size="small" color="info" />
            </CardContent>
          </Card>

          <Card sx={{ ...PANEL_SX, mb: 2 }}>
            <Tabs value={activeView} onChange={(_, value: ViewId) => setActiveView(value)} variant="scrollable" scrollButtons="auto" aria-label="PhaseAgent project views" sx={{ minHeight: 48, "& .MuiTab-root": { minHeight: 48, minWidth: 116, fontSize: 12, textTransform: "none" } }}>
              {VIEW_TABS.map((view) => {
                const Icon = view.icon;
                return <Tab key={view.id} value={view.id} icon={<Icon size={16} />} iconPosition="start" label={view.label} />;
              })}
            </Tabs>
          </Card>
          {page}
        </>
      )}

      <Snackbar open={Boolean(message)} autoHideDuration={2400} onClose={() => setMessage("")} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity="success" variant="filled" onClose={() => setMessage("")}>{message}</Alert>
      </Snackbar>
    </Box>
  );
}
