import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Select,
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
  Tooltip,
  Typography,
} from "@mui/material";
import type { LucideIcon } from "lucide-react";
import {
  Archive,
  ArrowRight,
  Blocks,
  BookOpenText,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  Container,
  Copy,
  Database,
  DatabaseZap,
  Dices,
  Download,
  FileCode2,
  FileLock2,
  Files,
  FileTerminal,
  FileText,
  FolderGit2,
  GitBranch,
  HardDrive,
  LockKeyhole,
  Network,
  PackageOpen,
  PlugZap,
  RefreshCw,
  Search,
  ServerCog,
  Settings2,
  Sparkles,
  Waypoints,
} from "lucide-react";

type ViewId = "overview" | "skills" | "memory" | "prompts" | "vector-db" | "resources" | "runtime";
type SkillId = "bundle" | "root" | "node" | "leaf" | "support";
type PromptId = "agents" | "env" | "readme";

const PANEL_SX = {
  border: "1px solid",
  borderColor: "divider",
  boxShadow: "none",
  overflow: "hidden",
};

const MONO_SX = {
  fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
};

const WHITE_SELECT_SX = {
  bgcolor: "background.paper",
  "& .MuiNativeSelect-select": { bgcolor: "background.paper" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "primary.light" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "primary.main" },
};

const VIEW_TABS: Array<{ id: ViewId; label: string; icon: LucideIcon; badge?: string }> = [
  { id: "overview", label: "项目拓扑", icon: Network },
  { id: "skills", label: "Skills", icon: Blocks, badge: "21" },
  { id: "memory", label: "Memory", icon: BrainCircuit },
  { id: "prompts", label: "Prompts", icon: FileCode2 },
  { id: "vector-db", label: "Vector DB", icon: DatabaseZap },
  { id: "resources", label: "Resources", icon: Database },
  { id: "runtime", label: "Runtime", icon: Container },
];

const SKILLS: Array<{
  id: SkillId;
  title: string;
  subtitle: string;
  count: string;
  icon: LucideIcon;
}> = [
  { id: "bundle", title: "Skills Bundle", subtitle: "skills/.agents/skills", count: "2,398", icon: PackageOpen },
  { id: "root", title: "Root Skills", subtitle: "SKILL.md definitions", count: "21", icon: Blocks },
  { id: "node", title: "Skill Nodes", subtitle: "node.md orchestration", count: "122", icon: GitBranch },
  { id: "leaf", title: "Leaf Instructions", subtitle: "leaf.md execution units", count: "623", icon: FileTerminal },
  { id: "support", title: "Supporting files", subtitle: "references · scripts · assets", count: "1,632", icon: Files },
];

const SKILL_DETAILS: Record<SkillId, {
  title: string;
  path: string;
  state: string;
  files: string;
  definitions: string;
  nodes: string;
  leaves: string;
  note: string;
  hash: string;
}> = {
  bundle: {
    title: "Skills Bundle",
    path: "skills/.agents/skills",
    state: "FROZEN",
    files: "2,398",
    definitions: "21",
    nodes: "122",
    leaves: "623",
    note: "Manifest 只提供数量和整棵目录的指纹，没有列出 21 个 Skill 的名称。连接已安装的 Runtime 或展开 release bundle 后，才能显示真实 Skill 树与正文。",
    hash: "tree_sha256 · 331b982c21a20755298c52f01f7b86e4a7cda2a9cf9d0f6bca6ad0be6d18e890",
  },
  root: {
    title: "Root Skills",
    path: "skills/.agents/skills/**/SKILL.md",
    state: "MANIFEST ONLY",
    files: "21",
    definitions: "21",
    nodes: "—",
    leaves: "—",
    note: "发布清单确认存在 21 个 SKILL.md 入口，但没有逐项文件名或正文。页面不会根据通用 Skill 猜测项目能力。",
    hash: "pattern · **/SKILL.md · count 21",
  },
  node: {
    title: "Skill Nodes",
    path: "skills/.agents/skills/**/node.md",
    state: "MANIFEST ONLY",
    files: "122",
    definitions: "—",
    nodes: "122",
    leaves: "—",
    note: "Node 文件描述 Skill 内部的阶段和编排关系。当前交接目录不能解析 122 个节点的依赖图。",
    hash: "pattern · **/node.md · count 122",
  },
  leaf: {
    title: "Leaf Instructions",
    path: "skills/.agents/skills/**/leaf.md",
    state: "MANIFEST ONLY",
    files: "623",
    definitions: "—",
    nodes: "—",
    leaves: "623",
    note: "Leaf 文件是 Skill 的执行单元。Manifest 确认 623 个 leaf.md，但没有暴露工具、输入输出或调用条件。",
    hash: "pattern · **/leaf.md · count 623",
  },
  support: {
    title: "Supporting Files",
    path: "skills/.agents/skills/**",
    state: "DERIVED",
    files: "1,632",
    definitions: "—",
    nodes: "—",
    leaves: "—",
    note: "支持文件数按 2,398 - 21 - 122 - 623 计算，可能包含脚本、参考资料、模板与资产，具体类型需展开 bundle 后确认。",
    hash: "derived_count · 1,632",
  },
};

const PROMPT_FILES: Record<PromptId, { title: string; meta: string; icon: LucideIcon; state: string; content: string }> = {
  agents: {
    title: "runtime/AGENTS.md",
    meta: "sha256 · 4d7bb79f…e9491c1 · manifest declared",
    icon: FileLock2,
    state: "未展开",
    content: `# Content not materialized

The release manifest declares this instruction file:

path: runtime/AGENTS.md
sha256: 4d7bb79f4664728fb38520f1299545607373602d33085c402088583aee9491c1

The handoff directory does not contain the expanded release bundle,
so the instruction content cannot be inspected from ../PhaseAgent yet.

Expand phaseagent-0.6.0.tar.gz or connect the installed runtime to load it.`,
  },
  env: {
    title: "phaseagent.env.example",
    meta: "host configuration · readable from handoff",
    icon: Settings2,
    state: "可读",
    content: `# PhaSeAgent 0.6.0 host configuration
PHASEAGENT_IMAGE=phaseagent-agent-platform:0.6.0
PHASEAGENT_HOME=~/.phaseagent
PHASEAGENT_DATA_ROOT=/path/to/phaseagent-data

# EB mode: auto | cuda | cpu | remote
PHASEAGENT_EB_MODE=auto
# Local backend: auto | docker | host
PHASEAGENT_EB_LOCAL_BACKEND=auto
PHASEAGENT_EB_DEVICE=0

# Agent defaults
PHASEAGENT_AGENT_BACKEND=codex
PHASEAGENT_CODEX_MODEL=gpt-5.4
PHASEAGENT_CODEX_REASONING=xhigh`,
  },
  readme: {
    title: "README.md",
    meta: "internal handoff guide · readable from handoff",
    icon: BookOpenText,
    state: "可读",
    content: `# PhaSeAgent 0.6.0 internal handoff

This directory is an internal-research handoff, not a source checkout.
It contains the frozen release, Docker image, EB evidence pack, SDB-v2,
the matching Qwen embedding model, and public biomedical data.

## Install and verify
./install-internal.sh /mnt/data/phaseagent-data
phaseagent resources
phaseagent doctor
phaseagent eb start --eb-mode auto

## Start the agent
phaseagent agent --backend codex

Excluded: licensed data mounts, credentials, original PDFs,
and benchmark payloads.`,
  },
};

const RESOURCE_PACKS = [
  { title: "Evidence Base Pack", file: "phaseagent-eb-pack-0.6.0.tar.zst", size: "3.53 GB", icon: FileText },
  { title: "SDB v2.0.0", file: "phaseagent-sdb-v2.0.0.tar.zst", size: "228.2 MB", icon: Database },
  { title: "Qwen3-VL Embedding", file: "qwen3-vl-embedding-2b.tar.zst", size: "3.33 GB", icon: Sparkles },
  { title: "Biomedical Public", file: "phaseagent-biomedical-public-pack-0.6.0.tar.zst", size: "184.7 MB", icon: HardDrive },
];

const SOURCE_COUNTS = [
  { name: "PhaSePred", count: "116,806", value: 100 },
  { name: "Reactome", count: "91,531", value: 78.4 },
  { name: "CORUM", count: "26,762", value: 22.9 },
  { name: "MLOsMetaDB", count: "12,038", value: 10.3 },
  { name: "CD-CODE", count: "11,133", value: 9.5 },
  { name: "DrLLPS", count: "9,281", value: 7.9 },
];

const VECTOR_DB_FILES = [
  { name: "db_meta.json", size: "237 B", role: "数据库元信息", state: "declared" },
  { name: "kb_manifest.json", size: "4.94 MB", role: "知识库文档与 Chunk 清单", state: "declared" },
  { name: "document_catalog", size: "23.24 MB", role: "文档目录快照", state: "verified" },
  { name: "api_enriched", size: "2.24 MB", role: "外部 API 补充元数据", state: "verified" },
];

const VECTOR_SAMPLE_COLUMNS = [
  ["record_id", "向量记录唯一标识"],
  ["document_id", "来源文档标识"],
  ["source", "数据来源或目录"],
  ["chunk_text", "参与 Embedding 的文本内容"],
  ["vector_dim", "向量维度"],
  ["norm", "向量 L2 范数"],
  ["metadata", "页码、章节和证据属性"],
];

const RUNTIME_ROWS = [
  ["Default command", "shell", "release manifest"],
  ["Agent backend", "codex", "env example"],
  ["Model", "gpt-5.4 / xhigh", "env example"],
  ["Workspace target", "/workspace · read-write", "release manifest"],
  ["EB socket", "/run/phaseagent-eb/eb.sock", "release manifest"],
  ["Vector DB", "/mnt/vector-db", "release manifest"],
  ["Embedding model", "/mnt/models/Qwen3-VL-Embedding-2B", "release manifest"],
];

function SummaryGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: `repeat(${items.length}, minmax(0, 1fr))` } }}>
      {items.map(([label, value], index) => (
        <Box key={label} sx={{ p: 2, borderRight: { md: index < items.length - 1 ? "1px solid" : 0 }, borderBottom: { xs: "1px solid", md: 0 }, borderColor: "divider", minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Typography variant="body2" fontWeight={700} sx={{ mt: 0.5, overflowWrap: "anywhere" }}>{value}</Typography>
        </Box>
      ))}
    </Box>
  );
}

function TopologyNode({ icon: Icon, title, detail, code, accent = "primary.main" }: {
  icon: LucideIcon;
  title: string;
  detail: string;
  code: string;
  accent?: string;
}) {
  return (
    <Box sx={{ minWidth: 180, p: 1.5, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderTop: "3px solid", borderTopColor: accent, borderRadius: 1.5 }}>
      <Stack direction="row" spacing={1} alignItems="center" mb={0.75}>
        <Icon size={15} />
        <Typography variant="body2" fontWeight={700}>{title}</Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" display="block">{detail}</Typography>
      <Typography variant="caption" sx={{ ...MONO_SX, mt: 0.75, display: "block", overflowWrap: "anywhere" }}>{code}</Typography>
    </Box>
  );
}

function OverviewView() {
  return (
    <Stack spacing={2}>
      <Card sx={PANEL_SX}>
        <SummaryGrid items={[
          ["产品 / Release", "PhaSeAgent 0.6.0"],
          ["分发范围", "Internal research"],
          ["Runtime image", "9.21 GB"],
          ["Skills", "21 / 2,398 files"],
          ["SDB v2", "289,822 records"],
        ]} />
      </Card>

      <Card sx={PANEL_SX}>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography variant="h3">发布清单拓扑</Typography>
            <Chip label="frozen release" color="success" size="small" />
          </Box>
          <Box sx={{ overflowX: "auto", bgcolor: "grey.50", p: 2 }}>
            <Box sx={{ minWidth: 940, display: "grid", gridTemplateColumns: "180px 40px 210px 40px 1fr", alignItems: "center" }}>
              <TopologyNode icon={Waypoints} title="PhaseAgent CLI" detail="shell · exec · agent · doctor · eb" code="default: shell" />
              <ArrowRight size={18} style={{ justifySelf: "center", color: "#9e9e9e" }} />
              <TopologyNode icon={Container} title="Agent Runtime" detail="Docker · read-write workspace" code="phaseagent-agent-platform:0.6.0" accent="error.main" />
              <ArrowRight size={18} style={{ justifySelf: "center", color: "#9e9e9e" }} />
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1 }}>
                <TopologyNode icon={PackageOpen} title="Skills Bundle" detail="21 SKILL.md · 122 nodes" code="frozen" />
                <TopologyNode icon={ServerCog} title="EB Service" detail="7,365 Markdown documents" code="auto / cuda / cpu / remote" accent="#00897b" />
                <TopologyNode icon={Database} title="SDB v2" detail="17 sources · 289,822 records" code="integrity: ok" accent="warning.main" />
                <TopologyNode icon={Sparkles} title="Embedding" detail="Qwen3-VL-Embedding-2B" code="/mnt/models" accent="success.main" />
                <TopologyNode icon={HardDrive} title="Public Bio Pack" detail="public biomedical resources" code="184.7 MB" accent="secondary.main" />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card sx={{ ...PANEL_SX, height: "100%" }}>
            <CardContent>
              <Typography variant="h3" mb={1.5}>当前交接目录</Typography>
              <Box component="pre" sx={{ ...MONO_SX, m: 0, p: 2, bgcolor: "#14161b", color: "#d9e0e8", borderRadius: 1.5, fontSize: 11, lineHeight: 1.9, overflowX: "auto" }}>{`../PhaseAgent/
├── README.md                                  internal handoff guide
├── handoff-manifest.json                     image + packs + boundary
├── phaseagent-0.6.0.release-manifest.json    runtime + skills + resources
├── phaseagent.env.example                    host and agent defaults
└── install-internal.sh                       one-command installer`}</Box>
              <Alert severity="info" sx={{ mt: 2, fontSize: 12 }}>
                当前目录是内部交接快照，不是源码工作树。Skills 内容与 runtime/AGENTS.md 只在 release bundle 中声明。
              </Alert>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ ...PANEL_SX, height: "100%" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                <LockKeyhole size={17} />
                <Typography variant="h3">完整性边界</Typography>
              </Stack>
              {[
                ["Benchmark 数据", "未包含"],
                ["API credentials", "未包含"],
                ["Licensed data", "未包含"],
                ["Skill rebuild", "无需"],
                ["Distribution", "internal only"],
              ].map(([label, value]) => (
                <Box key={label} sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 1.2, borderBottom: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" fontWeight={600}>{label}</Typography>
                  <Typography variant="caption" color="text.secondary">{value}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

function SkillsView() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SkillId>("bundle");
  const visibleSkills = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return SKILLS;
    return SKILLS.filter((skill) => `${skill.title} ${skill.subtitle}`.toLowerCase().includes(normalized));
  }, [query]);
  const detail = SKILL_DETAILS[selected];

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4} lg={3}>
        <Card sx={PANEL_SX}>
          <CardContent sx={{ p: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="筛选 Skill 层级"
              inputProps={{ "aria-label": "筛选 Skill 层级" }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search size={15} /></InputAdornment> }}
            />
          </CardContent>
          <Divider />
          <Box sx={{ py: 0.5 }}>
            {visibleSkills.map((skill) => {
              const Icon = skill.icon;
              const active = selected === skill.id;
              return (
                <ButtonBase
                  key={skill.id}
                  onClick={() => setSelected(skill.id)}
                  aria-pressed={active}
                  sx={{ width: "100%", px: 1.5, py: 1.25, justifyContent: "flex-start", textAlign: "left", borderLeft: "3px solid", borderLeftColor: active ? "primary.main" : "transparent", bgcolor: active ? "rgba(103, 58, 183, 0.08)" : "transparent", "&:hover": { bgcolor: "grey.100" } }}
                >
                  <Box sx={{ width: 32, height: 32, borderRadius: 1.25, display: "grid", placeItems: "center", mr: 1.25, color: active ? "primary.main" : "text.secondary", bgcolor: active ? "rgba(103, 58, 183, 0.10)" : "grey.100", flexShrink: 0 }}><Icon size={16} /></Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>{skill.title}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">{skill.subtitle}</Typography>
                  </Box>
                  <Chip label={skill.count} size="small" sx={{ ml: 1, minWidth: 48 }} />
                </ButtonBase>
              );
            })}
            {visibleSkills.length === 0 && <Typography variant="caption" color="text.secondary" display="block" textAlign="center" py={4}>没有匹配的层级</Typography>}
          </Box>
        </Card>
      </Grid>
      <Grid item xs={12} md={8} lg={9}>
        <Card sx={PANEL_SX}>
          <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, borderBottom: "1px solid", borderColor: "divider" }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700}>{detail.title}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ...MONO_SX, overflowWrap: "anywhere" }}>{detail.path}</Typography>
            </Box>
            <Chip label={detail.state} color={detail.state === "FROZEN" ? "success" : "warning"} size="small" />
          </Box>
          <SummaryGrid items={[["文件数", detail.files], ["定义数", detail.definitions], ["节点数", detail.nodes], ["叶子数", detail.leaves]]} />
          <Divider />
          <CardContent>
            {selected === "bundle" && (
              <TableContainer sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead><TableRow>{["层级", "文件模式", "数量", "用途", "状态"].map((heading) => <TableCell key={heading} sx={{ fontSize: 10, fontWeight: 700 }}>{heading}</TableCell>)}</TableRow></TableHead>
                  <TableBody>
                    {[
                      ["Root", "**/SKILL.md", "21", "技能入口与路由说明"],
                      ["Node", "**/node.md", "122", "多阶段编排节点"],
                      ["Leaf", "**/leaf.md", "623", "可执行叶子指令"],
                      ["Support", "其他资源", "1,632", "脚本、参考资料与资产"],
                    ].map((row) => (
                      <TableRow key={row[0]}>
                        <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>{row[0]}</TableCell>
                        <TableCell sx={{ ...MONO_SX, fontSize: 11 }}>{row[1]}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{row[2]}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{row[3]}</TableCell>
                        <TableCell><Chip label="Manifest only" size="small" color="warning" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <Alert severity={selected === "support" ? "warning" : "info"} icon={selected === "bundle" ? <Archive size={18} /> : undefined} sx={{ fontSize: 12 }}>{detail.note}</Alert>
            <Typography variant="caption" color="text.secondary" sx={{ ...MONO_SX, display: "block", mt: 2, overflowWrap: "anywhere" }}>{detail.hash}</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function MemoryView({ onConnect }: { onConnect: () => void }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={8}>
        <Card sx={{ ...PANEL_SX, height: "100%" }}>
          <CardContent>
            <Box sx={{ minHeight: 300, border: "1px dashed", borderColor: "divider", borderRadius: 1.5, display: "grid", placeItems: "center", textAlign: "center", p: 3 }}>
              <Box>
                <Box sx={{ width: 48, height: 48, display: "grid", placeItems: "center", mx: "auto", mb: 1.5, borderRadius: 1.5, color: "primary.main", bgcolor: "rgba(103, 58, 183, 0.10)" }}><BrainCircuit size={24} /></Box>
                <Typography variant="h3">发布清单未声明 Memory 后端</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 620, mt: 1, lineHeight: 1.8 }}>
                  当前 handoff manifest 没有 session store、checkpoint、conversation memory 或长期向量 Memory 配置，不能把现有 RAG Memory 指标归因到 PhaSeAgent 0.6.0。
                </Typography>
                <Button variant="contained" size="small" startIcon={<PlugZap size={15} />} onClick={onConnect} sx={{ mt: 2 }}>连接已安装 Runtime</Button>
              </Box>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr auto 1fr auto 1fr" }, alignItems: "center", gap: 1, mt: 2 }}>
              {[
                ["Agent events", "turn · tool · skill · result"],
                ["Runtime collector", "待接入 /status 与 logs"],
                ["Memory view", "Session · Checkpoint · Writeback"],
              ].map(([title, detail], index) => (
                <Box key={title} sx={{ display: "contents" }}>
                  <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1.5, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700}>{title}</Typography>
                    <Typography variant="caption" color="text.secondary">{detail}</Typography>
                  </Box>
                  {index < 2 && <ArrowRight size={16} style={{ color: "#9e9e9e" }} />}
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card sx={{ ...PANEL_SX, height: "100%" }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="h3">可确认的运行边界</Typography>
              <Chip label="未连接" color="warning" size="small" />
            </Stack>
            {[
              ["Workspace", "read-write"],
              ["Container target", "/workspace"],
              ["Vector DB", "/mnt/vector-db"],
              ["Extraction cache", "/mnt/eb-extraction-cache"],
              ["Memory schema", "not declared"],
              ["Session telemetry", "not connected"],
            ].map(([label, value]) => (
              <Box key={label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="caption" fontWeight={700} textAlign="right" sx={{ ...MONO_SX, overflowWrap: "anywhere" }}>{value}</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function PromptsView({ onCopy }: { onCopy: (content: string) => void }) {
  const [selected, setSelected] = useState<PromptId>("agents");
  const file = PROMPT_FILES[selected];

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4} lg={3}>
        <Card sx={PANEL_SX}>
          <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}><Typography variant="caption" color="text.secondary">指令与 Agent 配置</Typography></Box>
          {(Object.keys(PROMPT_FILES) as PromptId[]).map((id) => {
            const prompt = PROMPT_FILES[id];
            const Icon = prompt.icon;
            const active = selected === id;
            return (
              <ButtonBase key={id} onClick={() => setSelected(id)} aria-pressed={active} sx={{ width: "100%", px: 1.5, py: 1.3, justifyContent: "flex-start", textAlign: "left", bgcolor: active ? "rgba(103, 58, 183, 0.08)" : "transparent", borderLeft: "3px solid", borderLeftColor: active ? "primary.main" : "transparent", "&:hover": { bgcolor: "grey.100" } }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1.25, display: "grid", placeItems: "center", mr: 1.25, color: active ? "primary.main" : "text.secondary", bgcolor: "grey.100", flexShrink: 0 }}><Icon size={16} /></Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>{prompt.title}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">{prompt.meta.split(" · ")[0]}</Typography>
                </Box>
                <Chip label={prompt.state} size="small" color={id === "agents" ? "warning" : "success"} />
              </ButtonBase>
            );
          })}
        </Card>
      </Grid>
      <Grid item xs={12} md={8} lg={9}>
        <Card sx={PANEL_SX}>
          <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, borderBottom: "1px solid", borderColor: "divider" }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700}>{file.title}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>{file.meta}</Typography>
            </Box>
            <Tooltip title="复制内容"><IconButton size="small" aria-label="复制内容" onClick={() => onCopy(file.content)}><Copy size={15} /></IconButton></Tooltip>
          </Box>
          <Box component="pre" sx={{ ...MONO_SX, m: 0, minHeight: 360, p: 2.5, bgcolor: "#14161b", color: "#d9e0e8", fontSize: 11, lineHeight: 1.8, whiteSpace: "pre-wrap", overflowWrap: "anywhere", overflowX: "auto" }}>{file.content}</Box>
          <SummaryGrid items={[["Backend", "codex"], ["Model", "gpt-5.4"], ["Reasoning", "xhigh"], ["Workspace", "/workspace"]]} />
        </Card>
      </Grid>
    </Grid>
  );
}

function VectorDbView({ onMessage }: { onMessage: (message: string) => void }) {
  const [sampleCount, setSampleCount] = useState("10");
  const [sampleMode, setSampleMode] = useState("random");
  const [sampleSource, setSampleSource] = useState("all");
  const [includeVector, setIncludeVector] = useState(false);
  const [sampleAttempted, setSampleAttempted] = useState(false);

  const requestSample = () => {
    setSampleAttempted(true);
    onMessage(`Runtime 未连接，已保留 ${sampleCount} 条抽样条件`);
  };

  return (
    <Stack spacing={2}>
      <Card sx={PANEL_SX}>
        <Box sx={{ px: 2, py: 1.5, display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", gap: 1, borderBottom: "1px solid", borderColor: "divider" }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <DatabaseZap size={17} />
              <Typography variant="h3">Vector DB 存储快照</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">Manifest declared · live filesystem not connected</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip label="Manifest snapshot" color="primary" size="small" />
            <Chip label="未连接" color="warning" size="small" />
          </Stack>
        </Box>
        <SummaryGrid items={[
          ["挂载目标", "/mnt/vector-db"],
          ["EB Pack 归档", "3.53 GB"],
          ["Markdown 目录", "7,365"],
          ["Document catalog", "23.24 MB"],
          ["Embedding", "Qwen3-VL-Embedding-2B"],
        ]} />
        <Box sx={{ px: 2, pb: 2 }}>
          <Alert severity="warning" sx={{ fontSize: 12 }}>
            3.53 GB 是包含 Vector DB 的压缩 EB Pack 归档大小，不是解压后数据库的精确磁盘占用。连接 Runtime 后才能读取 live bytes、Collection、记录数和索引分片。
          </Alert>
        </Box>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={4}>
          <Card sx={{ ...PANEL_SX, height: "100%" }}>
            <CardContent>
              <Typography variant="h3" mb={2}>抽样条件</Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>抽样方式</Typography>
                  <Select native fullWidth size="small" value={sampleMode} onChange={(event) => setSampleMode(event.target.value)} inputProps={{ "aria-label": "抽样方式" }} sx={WHITE_SELECT_SX}>
                    <option value="random">随机记录</option>
                    <option value="recent">最近写入</option>
                    <option value="source-balanced">按来源均衡</option>
                  </Select>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>数据来源</Typography>
                  <Select native fullWidth size="small" value={sampleSource} onChange={(event) => setSampleSource(event.target.value)} inputProps={{ "aria-label": "数据来源" }} sx={WHITE_SELECT_SX}>
                    <option value="all">全部来源</option>
                    <option value="markdown">Markdown documents</option>
                    <option value="api-enriched">API enriched</option>
                    <option value="sdb">SDB records</option>
                  </Select>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>抽样数量</Typography>
                  <Select native fullWidth size="small" value={sampleCount} onChange={(event) => setSampleCount(event.target.value)} inputProps={{ "aria-label": "抽样数量" }} sx={WHITE_SELECT_SX}>
                    {["5", "10", "20", "50"].map((count) => <option key={count} value={count}>{count} 条</option>)}
                  </Select>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, py: 0.75 }}>
                  <Box><Typography variant="body2" fontWeight={600}>向量值预览</Typography><Typography variant="caption" color="text.secondary">仅显示前 8 维</Typography></Box>
                  <Switch checked={includeVector} onChange={(event) => setIncludeVector(event.target.checked)} inputProps={{ "aria-label": "向量值预览" }} />
                </Box>
                <Button variant="contained" size="small" startIcon={<Dices size={15} />} onClick={requestSample}>执行抽样</Button>
                <Button variant="outlined" size="small" startIcon={<PlugZap size={15} />} onClick={() => onMessage("需要先安装 Runtime，并挂载 /mnt/vector-db")}>连接 Runtime</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={8}>
          <Card sx={{ ...PANEL_SX, height: "100%" }}>
            <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, borderBottom: "1px solid", borderColor: "divider" }}>
              <Box><Typography variant="h3">内容抽样</Typography><Typography variant="caption" color="text.secondary">只读 · 不修改向量或元数据</Typography></Box>
              <Chip label="0 rows" size="small" />
            </Box>
            {sampleAttempted && (
              <Alert severity="warning" sx={{ m: 2, mb: 0, fontSize: 12 }}>
                抽样未执行：本机没有 PhaseAgent Runtime 或可读的 /mnt/vector-db。当前条件为 {sampleMode} · {sampleSource} · {sampleCount} 条{includeVector ? " · 含前 8 维向量" : ""}。
              </Alert>
            )}
            <TableContainer>
              <Table size="small" sx={{ minWidth: 720 }}>
                <TableHead><TableRow>{["record_id", "source", "document_id", "chunk_text", "dim", "norm", "metadata"].map((heading) => <TableCell key={heading} sx={{ ...MONO_SX, fontSize: 10, fontWeight: 700 }}>{heading}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 7, textAlign: "center", borderBottom: 0 }}>
                      <Box sx={{ width: 44, height: 44, display: "grid", placeItems: "center", mx: "auto", mb: 1.25, borderRadius: 1.5, bgcolor: "grey.100", color: "text.secondary" }}><DatabaseZap size={21} /></Box>
                      <Typography variant="body2" fontWeight={700}>等待 Runtime 数据</Typography>
                      <Typography variant="caption" color="text.secondary">连接后按当前条件返回真实向量记录</Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Card sx={PANEL_SX}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}><Typography variant="h3">Manifest 可见文件</Typography></Box>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>{["文件 / 目录", "大小", "用途", "状态"].map((heading) => <TableCell key={heading} sx={{ fontSize: 10, fontWeight: 700 }}>{heading}</TableCell>)}</TableRow></TableHead>
                <TableBody>{VECTOR_DB_FILES.map((file) => <TableRow key={file.name}><TableCell sx={{ ...MONO_SX, fontSize: 11 }}>{file.name}</TableCell><TableCell sx={{ ...MONO_SX, fontSize: 11 }}>{file.size}</TableCell><TableCell sx={{ fontSize: 11 }}>{file.role}</TableCell><TableCell><Chip label={file.state} color="success" size="small" /></TableCell></TableRow>)}</TableBody>
              </Table>
            </TableContainer>
            <Typography variant="caption" color="text.secondary" sx={{ ...MONO_SX, display: "block", p: 2, borderTop: "1px solid", borderColor: "divider", overflowWrap: "anywhere" }}>database_fingerprint · 002218d2ce9db91c9e0c4b6ed08619b3048c5c277a804d55644cb83012bbf177</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Card sx={{ ...PANEL_SX, height: "100%" }}>
            <CardContent>
              <Typography variant="h3" mb={1.5}>记录字段</Typography>
              {VECTOR_SAMPLE_COLUMNS.map(([field, description]) => (
                <Box key={field} sx={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 1.5, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" fontWeight={700} sx={MONO_SX}>{field}</Typography>
                  <Typography variant="caption" color="text.secondary">{description}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

function ResourcesView() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={8}>
        <Card sx={PANEL_SX}>
          <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid", borderColor: "divider" }}>
            <Box><Typography variant="h3">Resource Packs</Typography><Typography variant="caption" color="text.secondary">handoff-manifest.json · exact archive inventory</Typography></Box>
            <Chip label="4 packs" size="small" />
          </Box>
          {RESOURCE_PACKS.map((pack) => {
            const Icon = pack.icon;
            return (
              <Box key={pack.title} sx={{ px: 2, py: 1.5, display: "grid", gridTemplateColumns: { xs: "36px 1fr", sm: "36px 1fr auto auto" }, gap: 1.5, alignItems: "center", borderBottom: "1px solid", borderColor: "divider" }}>
                <Box sx={{ width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: 1.25, color: "primary.main", bgcolor: "rgba(103, 58, 183, 0.09)" }}><Icon size={17} /></Box>
                <Box sx={{ minWidth: 0 }}><Typography variant="body2" fontWeight={700}>{pack.title}</Typography><Typography variant="caption" color="text.secondary" sx={{ ...MONO_SX, overflowWrap: "anywhere" }}>{pack.file}</Typography></Box>
                <Typography variant="caption" fontWeight={700} sx={MONO_SX}>{pack.size}</Typography>
                <Chip label="declared" color="success" size="small" />
              </Box>
            );
          })}
          <Box sx={{ px: 2, py: 1.5, borderTop: "8px solid", borderColor: "grey.50" }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1} mb={1.5}>
              <Box><Typography variant="h3">SDB v2 质量</Typography><Typography variant="caption" color="text.secondary">17 sources · integrity check: ok</Typography></Box>
              <Chip label="289,822 unique" color="success" size="small" />
            </Stack>
            <SummaryGrid items={[["Records", "289,822"], ["FTS records", "289,822"], ["Aliases", "3,297,487"], ["Missing IDs", "0"]]} />
          </Box>
        </Card>
      </Grid>
      <Grid item xs={12} lg={4}>
        <Card sx={{ ...PANEL_SX, height: "100%" }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h3">主要数据源</Typography>
              <Chip label="Top 6 / 17" size="small" />
            </Stack>
            <Stack spacing={1.5}>
              {SOURCE_COUNTS.map((source) => (
                <Box key={source.name} sx={{ display: "grid", gridTemplateColumns: "86px 1fr 60px", gap: 1, alignItems: "center" }}>
                  <Typography variant="caption" fontWeight={600}>{source.name}</Typography>
                  <LinearProgress variant="determinate" value={source.value} sx={{ height: 5, borderRadius: 2 }} />
                  <Typography variant="caption" textAlign="right" fontWeight={700} sx={MONO_SX}>{source.count}</Typography>
                </Box>
              ))}
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}><Typography variant="caption" color="text.secondary">Live adapters</Typography><Typography variant="caption" fontWeight={700}>5</Typography></Box>
            <Typography variant="caption" color="text.secondary" display="block" mt={1} lineHeight={1.7}>UniProt · STRING · dbPTM · InterPro · MobiDB。外部 enrichment 不计入本地 SDB 命中。</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function RuntimeView() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={8}>
        <Card sx={PANEL_SX}>
          <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, borderBottom: "1px solid", borderColor: "divider" }}>
            <Box sx={{ minWidth: 0 }}><Typography variant="body2" fontWeight={700} sx={{ overflowWrap: "anywhere" }}>phaseagent-agent-platform:0.6.0</Typography><Typography variant="caption" color="text.secondary">Docker runtime · 9,214,150,690 bytes</Typography></Box>
            <Chip label="manifest verified" color="success" size="small" />
          </Box>
          <Box sx={{ px: 2, py: 1.5, display: "flex", flexWrap: "wrap", gap: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
            {["shell", "exec", "agent", "info", "resources", "doctor", "eb", "status", "logs", "wait", "stop"].map((command) => <Chip key={command} label={command} variant="outlined" size="small" sx={{ ...MONO_SX, borderRadius: 1 }} />)}
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>{["Runtime contract", "值", "来源"].map((heading) => <TableCell key={heading} sx={{ fontSize: 10, fontWeight: 700 }}>{heading}</TableCell>)}</TableRow></TableHead>
              <TableBody>{RUNTIME_ROWS.map((row) => <TableRow key={row[0]}><TableCell sx={{ fontSize: 11 }}>{row[0]}</TableCell><TableCell sx={{ ...MONO_SX, fontSize: 11 }}>{row[1]}</TableCell><TableCell sx={{ fontSize: 11, color: "text.secondary" }}>{row[2]}</TableCell></TableRow>)}</TableBody>
            </Table>
          </TableContainer>
          <Typography variant="caption" color="text.secondary" sx={{ ...MONO_SX, display: "block", p: 2, borderTop: "1px solid", borderColor: "divider", overflowWrap: "anywhere" }}>image_id · sha256:1407d169bc1dd7ce58a6ea516689b400337d06db2206d7f58851541586af9962</Typography>
        </Card>
      </Grid>
      <Grid item xs={12} lg={4}>
        <Card sx={{ ...PANEL_SX, height: "100%" }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}><Typography variant="h3">EB 启动配置</Typography><Chip label="auto" color="info" size="small" /></Stack>
            {[["Device mode", "auto"], ["可选模式", "auto / cuda / cpu / remote"], ["Local backend", "auto"], ["可选 backend", "docker / host"]].map(([label, value]) => (
              <Box key={label} sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="caption" fontWeight={700} textAlign="right" sx={{ ...MONO_SX, overflowWrap: "anywhere" }}>{value}</Typography></Box>
            ))}
            <Box component="pre" sx={{ ...MONO_SX, m: 0, mt: 2, p: 2, bgcolor: "#14161b", color: "#d9e0e8", borderRadius: 1.5, fontSize: 11, lineHeight: 1.9, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{`phaseagent resources
phaseagent doctor
phaseagent eb start --eb-mode auto
phaseagent agent --backend codex`}</Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default function AgentProject() {
  const [activeView, setActiveView] = useState<ViewId>("overview");
  const [message, setMessage] = useState("");

  const showMessage = (nextMessage: string) => setMessage(nextMessage);

  const copyPrompt = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      showMessage("当前文件内容已复制");
    } catch {
      showMessage("浏览器未开放剪贴板权限");
    }
  };

  return (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "flex-start" }, gap: 2, mb: 2.5 }}>
        <Box>
          <Typography variant="h1">PhaseAgent 项目</Typography>
          <Typography variant="body2" color="text.secondary">发布清单、Skills、Memory、Prompts、Vector DB、资源与 Runtime 的统一视图</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button fullWidth variant="outlined" size="small" startIcon={<Download size={14} />} onClick={() => showMessage("PhaseAgent 项目快照已导出")}>导出快照</Button>
          <Button fullWidth variant="contained" size="small" startIcon={<RefreshCw size={14} />} onClick={() => showMessage("已重新读取 5 个交接文件，Manifest 无变化")}>重新扫描</Button>
        </Stack>
      </Box>

      <Card sx={{ ...PANEL_SX, mb: 2 }}>
        <CardContent sx={{ py: 1.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", "&:last-child": { pb: 1.5 } }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mr: 0.5 }}><FolderGit2 size={17} /><Typography variant="body2" fontWeight={700} sx={MONO_SX}>../PhaseAgent</Typography></Stack>
          <Chip label="Manifest snapshot" size="small" color="primary" />
          <Chip icon={<CheckCircle2 size={13} />} label="5 个交接文件可见" size="small" color="success" />
          <Chip icon={<CircleAlert size={13} />} label="Release bundle 未展开" size="small" color="warning" />
          <Typography variant="caption" color="text.secondary" sx={{ ...MONO_SX, ml: { md: "auto" }, overflowWrap: "anywhere" }}>release-manifest · 2026-07-25T07:19:42Z</Typography>
        </CardContent>
      </Card>

      <Card sx={{ ...PANEL_SX, mb: 2 }}>
        <Tabs
          value={activeView}
          onChange={(_, value: ViewId) => setActiveView(value)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="PhaseAgent 项目视图"
          sx={{ minHeight: 48, "& .MuiTab-root": { minHeight: 48, minWidth: 118, fontSize: 12, textTransform: "none" } }}
        >
          {VIEW_TABS.map((view) => {
            const Icon = view.icon;
            return <Tab key={view.id} value={view.id} icon={<Icon size={16} />} iconPosition="start" label={<Stack direction="row" alignItems="center" spacing={0.75}><span>{view.label}</span>{view.badge && <Chip label={view.badge} size="small" />}</Stack>} />;
          })}
        </Tabs>
      </Card>

      {activeView === "overview" && <OverviewView />}
      {activeView === "skills" && <SkillsView />}
      {activeView === "memory" && <MemoryView onConnect={() => showMessage("需要先安装 Runtime，并接入 status / logs collector")} />}
      {activeView === "prompts" && <PromptsView onCopy={copyPrompt} />}
      {activeView === "vector-db" && <VectorDbView onMessage={showMessage} />}
      {activeView === "resources" && <ResourcesView />}
      {activeView === "runtime" && <RuntimeView />}

      <Snackbar open={Boolean(message)} autoHideDuration={2600} onClose={() => setMessage("")} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity="success" variant="filled" onClose={() => setMessage("")} sx={{ width: "100%" }}>{message}</Alert>
      </Snackbar>
    </Box>
  );
}
