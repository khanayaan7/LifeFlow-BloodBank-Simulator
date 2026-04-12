module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#ff5555",
        "primary-container": "#ff8080",
        "primary-fixed": "#ff6b6b",
        "primary-fixed-dim": "#ff3333",
        secondary: "#ff7777",
        "secondary-container": "#ffcccc",
        tertiary: "#27AE60",
        "tertiary-container": "#e8f5e9",
        surface: "#fffbfe",
        "surface-bright": "#fffbfe",
        "surface-container": "#f8f4f9",
        "surface-container-low": "#f2eff4",
        "surface-container-lowest": "#fcf8fd",
        "surface-container-high": "#ede8f3",
        "surface-container-highest": "#e7e1ec",
        "on-surface": "#1d1b20",
        "on-surface-variant": "#49454f",
        "on-primary": "#ffffff",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#1d1b1f",
        "outline-variant": "#cac7d0",
        success: "#27AE60",
        warning: "#F39C12",
        error: "#ff5555",
        appbg: "#fff0f0"
      },
      fontFamily: {
        display: ["'Manrope'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        heading: ["'Manrope'", "sans-serif"]
      },
      fontSize: {
        "display-lg": ["3.5rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "display-md": ["2.5rem", { lineHeight: "1.3" }],
        "display-sm": ["2rem", { lineHeight: "1.4" }],
        "headline-lg": ["1.75rem", { lineHeight: "1.4" }],
        "headline-md": ["1.5rem", { lineHeight: "1.4" }],
        "title-lg": ["1.375rem", { lineHeight: "1.4" }],
        "title-md": ["1rem", { lineHeight: "1.5" }],
        "body-lg": ["1rem", { lineHeight: "1.5" }],
        "body-md": ["0.875rem", { lineHeight: "1.5" }],
        "label-md": ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.05em" }]
      },
      boxShadow: {
        ambient: "0px 24px 48px rgba(25, 28, 29, 0.06)",
        card: "0px 24px 48px rgba(25, 28, 29, 0.06)"
      },
      borderRadius: {
        full: "9999px",
        xl: "1.5rem",
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem"
      },
      backdropBlur: {
        glass: "24px"
      }
    }
  },
  plugins: []
};
