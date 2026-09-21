/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#121212",      // Matte Black
          charcoal: "#1A1A1A",   // Charcoal Gray
          purple: "#E6C700",     // (legacy token — actually gold; kept for back-compat)
          blue: "#265DAB",       // Muted Electric Blue
          silver: "#A0A0A0",     // Matte Silver Gray
          text: "#D0D0D0",       // Warm Gray (Text)
          burgundy: "#8C2F39",   // Matte Burgundy
          sand: "#C2BEBE",       // Sandstone Beige
        },

        // ==========================================================
        // RIG BUILDERS — canonical brand palette (black / white / aqua)
        // Positioning: reliability, trust, engineered performance, PREMIUM.
        // Premium = restraint: mostly ink + space, aqua used surgically.
        //   • aqua        → electric HIGHLIGHT: glows, hairlines, active
        //                   states, small CTA text/icons. Use sparingly.
        //   • aqua-deep   → FILLS: buttons, bars, larger blocks (tames the neon)
        //   • aqua-ink    → text/icon color ON an aqua fill
        //   • teal        → on-LIGHT surfaces only (invoices, email, print)
        //   • success/danger → STATUS ONLY (in-stock / compatible vs not).
        //                      Never decorative.
        // ==========================================================
        rb: {
          black:    "#0A0A0A",   // deepest — hero / full-bleed sections
          surface:  "#101214",   // page background
          elevated: "#16191C",   // cards / panels
          line:     "#242A2E",   // hairline borders (solid equiv of white/8%)
          white:    "#F4F5F5",   // primary text on dark
          silver:   "#9AA3A3",   // muted / secondary text
          aqua:     "#14F1D9",   // ★ electric accent (highlight)
          "aqua-deep": "#0FBFAE",// accent fills (buttons, bars)
          "aqua-ink":  "#04120F",// text on aqua fills
          teal:     "#0D9488",   // accent for LIGHT backgrounds
          success:  "#22C55E",   // in stock / compatible
          danger:   "#F04438",   // out of stock / incompatible
          warn:     "#F5A524",   // low stock / caution (optional)
        },
      },
      fontFamily: {
        saira: ["var(--font-saira)", "sans-serif"],
        orbitron: ["var(--font-orbitron)", "sans-serif"],
      },
    },
  },
  plugins: [],
};