import { createTheme } from "@mui/material/styles";

/**
 * MUI theme aligned with CSS variables:
 * - Primary:   var(--primary-color)
 * - Secondary: var(--secondary-color)
 * - Surfaces:  var(--page-color), var(--form-input-color)
 * - Text:      var(--text-color)
 */
export const muiTheme = createTheme({
  typography: {
    fontFamily: "\"Poppins\", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  palette: {
    // IMPORTANT:
    // MUI palette requires concrete colors because it computes light/dark variants at build time.
    // CSS variables like `var(--primary-color)` will crash `createTheme()`.
    // We keep palette values as safe fallbacks, and drive real colors via CSS vars
    // in component overrides (Button/Card/Input/Table/etc).
    primary: { main: "#1976d2" },
    secondary: { main: "#9c27b0" },
    background: {
      default: "var(--body-background-color)",
      paper: "var(--page-color)",
    },
    text: {
      primary: "var(--text-color)",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "var(--body-background-color)",
          color: "var(--text-color)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 16,
          paddingBlock: 10,
        },
        containedPrimary: {
          background: "var(--primary-color)",
          color: "#fff",
        },
        outlinedPrimary: {
          borderColor: "var(--primary-color)",
          color: "var(--primary-color)",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: "var(--form-input-color)",
        },
        notchedOutline: {
          borderColor: "rgba(0,0,0,0.16)",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--primary-color)",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--primary-color)",
          boxShadow: "0 0 0 0.2rem color-mix(in srgb, var(--primary-color) 35%, transparent)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: "var(--primary-color)",
          color: "#fff",
          fontWeight: 700,
          borderBottom: "none",
        },
        body: {
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 10,
          padding: "10px 12px",
          fontSize: 12,
          backgroundColor: "rgba(17, 24, 39, 0.92)",
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          "&.Mui-checked": {
            color: "var(--primary-color)",
          },
          "&.Mui-checked + .MuiSwitch-track": {
            backgroundColor: "var(--primary-color)",
            opacity: 0.45,
          },
        },
      },
    },
  },
});

