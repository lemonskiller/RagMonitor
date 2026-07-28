import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#673ab7", light: "#9575cd", dark: "#5e35b1" },
    secondary: { main: "#e91e63" },
    error: { main: "#f44336" },
    warning: { main: "#ff9800" },
    success: { main: "#4caf50" },
    background: { default: "#f5f5f5", paper: "#ffffff" },
    text: { primary: "rgba(0,0,0,0.87)", secondary: "rgba(0,0,0,0.6)" },
    divider: "rgba(0,0,0,0.12)",
  },
  typography: {
    fontFamily: '"Roboto", "Noto Sans SC", -apple-system, sans-serif',
    h1: { fontSize: "1.5rem", fontWeight: 600 },
    h2: { fontSize: "1.25rem", fontWeight: 600 },
    h3: { fontSize: "1.125rem", fontWeight: 600 },
    body1: { fontSize: "0.875rem" },
    body2: { fontSize: "0.8125rem" },
    caption: { fontSize: "0.75rem" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 10 },
        containedPrimary: { boxShadow: "0 2px 8px rgba(103,58,183,0.25)" },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 2px 14px rgba(103,58,183,0.05)",
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 13, fontWeight: 600 } },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": { borderRadius: 10 },
        },
      },
    },
  },
});

export default theme;
