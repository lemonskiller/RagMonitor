import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import Layout from "./components/Layout/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import Knowledge from "./pages/Knowledge/Knowledge";
import Datasets from "./pages/Datasets/Datasets";
import Studio from "./pages/Studio/Studio";
import Evaluations from "./pages/Evaluations/Evaluations";
import Traces from "./pages/Traces/Traces";
import BadCases from "./pages/BadCases/BadCases";
import Monitoring from "./pages/Monitoring/Monitoring";
import Memory from "./pages/Memory/Memory";
import AgentProject from "./pages/AgentProject/AgentProject";
import Settings from "./pages/Settings/Settings";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/datasets" element={<Datasets />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/evaluations" element={<Evaluations />} />
            <Route path="/traces" element={<Traces />} />
            <Route path="/badcases" element={<BadCases />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/agent-project" element={<AgentProject />} />
            <Route path="/memory" element={<Memory />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}
