import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Avatar, Badge, InputBase, useMediaQuery, useTheme,
} from "@mui/material";
import {
  LayoutDashboard, Database, Library, Workflow, BrainCircuit,
  FlaskConical, Activity, CircleAlert, ChartNoAxesCombined,
  Settings2, Menu, Search, BookOpen, Bell, ChevronDown, Boxes,
} from "lucide-react";

const DRAWER_WIDTH = 240;
const TOPBAR_HEIGHT = 64;

const NAV_GROUPS = [
  {
    label: "概览",
    items: [{ path: "/", icon: LayoutDashboard, label: "工作台" }],
  },
  {
    label: "知识资产",
    items: [
      { path: "/knowledge", icon: Database, label: "知识库" },
      { path: "/datasets", icon: Library, label: "评测集" },
    ],
  },
  {
    label: "构建",
    items: [{ path: "/studio", icon: Workflow, label: "RAG Studio" }],
  },
  {
    label: "Agent",
    items: [
      { path: "/agent-project", icon: Boxes, label: "PhaseAgent 项目" },
      { path: "/memory", icon: BrainCircuit, label: "Memory 管理" },
    ],
  },
  {
    label: "验证",
    items: [{ path: "/evaluations", icon: FlaskConical, label: "评测任务" }],
  },
  {
    label: "可观测",
    items: [
      { path: "/traces", icon: Activity, label: "Trace" },
      { path: "/badcases", icon: CircleAlert, label: "Bad Case" },
      { path: "/monitoring", icon: ChartNoAxesCombined, label: "性能监控" },
    ],
  },
  {
    label: "系统",
    items: [{ path: "/settings", icon: Settings2, label: "应用接入" }],
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box
        sx={{
          height: TOPBAR_HEIGHT, display: "flex", alignItems: "center",
          px: 2.5, borderBottom: "1px solid", borderColor: "divider",
        }}
      >
        <Box
          sx={{
            width: 34, height: 34, mr: 1.5, borderRadius: 1.5,
            background: "linear-gradient(135deg, #673ab7, #5e35b1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 15,
          }}
        >R</Box>
        <Box>
          <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2}>
            RAG Scope
          </Typography>
          <Typography variant="caption" color="text.secondary">
            OPTIMIZE / OBSERVE
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: 1, py: 1.5 }}>
        {NAV_GROUPS.map((group) => (
          <Box key={group.label} sx={{ mb: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                px: 2, py: 1, display: "block",
                color: "text.secondary", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}
            >
              {group.label}
            </Typography>
            {group.items.map((item) => {
              const active = location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path));
              return (
                <ListItemButton
                  key={item.path}
                  onClick={() => { navigate(item.path); setMobileOpen(false); }}
                  sx={{
                    borderRadius: 1.5, mb: 0.25, minHeight: 42,
                    color: active ? "primary.dark" : "text.secondary",
                    bgcolor: active ? "secondary.50" : "transparent",
                    fontWeight: active ? 600 : 500,
                    "&:hover": { bgcolor: "grey.100" },
                    pl: 2,
                  }}
                >
                  <item.icon size={18} style={{ marginRight: 12 }} />
                  <Typography variant="body2" fontWeight="inherit">
                    {item.label}
                  </Typography>
                </ListItemButton>
              );
            })}
          </Box>
        ))}
      </Box>

      <Divider />
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "success.main" }} />
        <Typography variant="caption" color="text.secondary">
          Trace 接收正常 · 2s
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Desktop Drawer */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH, borderRight: "1px solid", borderColor: "divider" },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{ height: TOPBAR_HEIGHT, borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Toolbar sx={{ gap: { xs: 0.5, sm: 2 }, height: TOPBAR_HEIGHT, px: { xs: 1.5, sm: 3 }, minWidth: 0 }}>
            {isMobile && (
              <IconButton aria-label="打开导航" onClick={() => setMobileOpen(true)}><Menu size={20} /></IconButton>
            )}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, pr: { xs: 1, sm: 2 }, borderRight: "1px solid", borderColor: "divider", minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} sx={{ display: { xs: "none", sm: "block" } }}>PhaseAgent</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>/</Typography>
              <Typography variant="body2" fontWeight={600} noWrap>Research RAG</Typography>
              <ChevronDown size={14} />
            </Box>

            <Box sx={{ flex: 1, maxWidth: 440, position: "relative", display: { xs: "none", md: "block" } }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: "#9e9e9e" }} />
              <InputBase
                placeholder="搜索 Trace、Case 或问题"
                sx={{
                  width: "100%", height: 40, pl: 5, pr: 2,
                  bgcolor: "grey.100", borderRadius: 5, fontSize: 14,
                }}
              />
            </Box>

            <Box sx={{ flex: 1 }} />
            <IconButton aria-label="文档"><BookOpen size={18} /></IconButton>
            <IconButton aria-label="通知"><Bell size={18} /></IconButton>
            <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main", fontSize: 14 }}>YZ</Avatar>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flex: 1, p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
