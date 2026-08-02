import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Select,
  Skeleton,
  Snackbar,
  Stack,
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
  HardDrive,
  Network,
  RefreshCw,
  Search,
  ServerCog,
  Sparkles,
} from "lucide-react";

type ViewId = "overview" | "files" | "resources" | "skills" | "runtime" | "prompts";

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
  { id: "files", label: "交接文件", icon: FileText },
  { id: "resources", label: "资源包", icon: Database },
  { id: "skills", label: "Skills / SDB", icon: Boxes },
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

function SkillsAndSdb({ project }: { project: PhaseAgentProject }) {
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

      <Grid container spacing={2}>
        <Grid item xs={12} lg={5}>
          <Card sx={{ ...PANEL_SX, height: "100%" }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                <Database size={18} />
                <Typography variant="h3">数据库类型与大小</Typography>
              </Stack>
              <MetricGrid>
                <Metric label="Vector DB" value={project.databases.vectorStore.type} />
                <Metric label="Faiss" value={project.databases.vectorStore.isFaiss ? "yes" : "no"} />
                <Metric label="Milvus" value={project.databases.vectorStore.isMilvus ? "yes" : "no"} />
                <Metric label="EB archive" value={project.databases.vectorStore.compressedArchive.size} />
                <Metric label="SDB SQLite" value={project.databases.sdb.sqliteFile.size} />
              </MetricGrid>
              <Alert severity="info" sx={{ mt: 2, fontSize: 12 }}>{project.databases.vectorStore.engine}</Alert>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" fontWeight={800}>SDB tables</Typography>
              <TableContainer sx={{ mt: 1 }}>
                <Table size="small">
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
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={7}>
          <Card sx={PANEL_SX}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="h3">SDB 抽样记录</Typography>
              <Typography variant="caption" color="text.secondary">从缓存 SQLite `records` 表随机抽样 10 条</Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 420 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>{["record_id", "source", "entity", "primary_name", "gene", "organism", "evidence", "description"].map((heading) => <TableCell key={heading} sx={{ ...MONO_SX, fontSize: 10, fontWeight: 800 }}>{heading}</TableCell>)}</TableRow>
                </TableHead>
                <TableBody>
                  {project.databases.sdb.sampleRecords.map((row) => (
                    <TableRow key={String(row.record_id)}>
                      <TableCell sx={{ ...MONO_SX, fontSize: 10, maxWidth: 180, overflowWrap: "anywhere" }}>{String(row.record_id || "")}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{String(row.source_database || "")}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{String(row.entity_type || "")}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{String(row.primary_name || "")}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{String(row.gene_name || "")}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{String(row.organism || "")}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{String(row.evidence_class || "")}</TableCell>
                      <TableCell sx={{ fontSize: 11, minWidth: 260 }}>{String(row.description || "")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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

export default function AgentProject() {
  const [activeView, setActiveView] = useState<ViewId>("overview");
  const [project, setProject] = useState<PhaseAgentProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadProject = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}phaseagent/project`, { cache: "no-store" });
      if (!response.ok) throw new Error(`API ${response.status}`);
      const data = (await response.json()) as PhaseAgentProject;
      setProject(data);
      setMessage("已重新扫描 PhaseAgent 交接目录");
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "读取 PhaseAgent 项目失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProject();
  }, []);

  const page = useMemo(() => {
    if (!project) return null;
    if (activeView === "overview") return <Overview project={project} />;
    if (activeView === "files") return <Card sx={PANEL_SX}><FileTable files={project.mainFiles} /></Card>;
    if (activeView === "resources") return <Resources project={project} />;
    if (activeView === "skills") return <SkillsAndSdb project={project} />;
    if (activeView === "runtime") return <Runtime project={project} />;
    return <Prompts project={project} />;
  }, [activeView, project]);

  return (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "flex-start" }, gap: 2, mb: 2.5 }}>
        <Box>
          <Typography variant="h1">PhaseAgent 项目</Typography>
          <Typography variant="body2" color="text.secondary">从真实 handoff 目录实时读取 manifest、资源包、Skills、SDB 与 Runtime 信息</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button fullWidth variant="outlined" size="small" startIcon={<Download size={14} />} onClick={() => setMessage("当前视图来自实时 API，可直接保存页面快照")}>导出快照</Button>
          <Button fullWidth variant="contained" size="small" startIcon={<RefreshCw size={14} />} onClick={() => void loadProject()}>重新扫描</Button>
        </Stack>
      </Box>

      {loading && <Card sx={PANEL_SX}><CardContent><Skeleton height={42} /><Skeleton height={220} /></CardContent></Card>}
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
