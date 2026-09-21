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
        // RIG BUILDERS — canonical brand palette
        // MONOCHROME (black + white + grey ramp)  +  ONE accent: MOLTEN ORANGE.
        // Positioning: premium, engineered, performance. Trust is carried by
        // design discipline (space, type, proof) — NOT by the accent.
        // Premium = restraint: the orange lives on ~5–10% of any screen
        // (CTAs, active states, key numbers, the logo dot) — never as a wash.
        //   • orange       → THE accent. Small, deliberate, high-impact.
        //   • orange-deep  → hover / pressed / fills that need to sit calmer
        //   • orange-ink   → text/icon color ON an orange fill
        //   • orange-light → deeper orange for LIGHT surfaces (invoice/email/print)
        //   • success / danger → STATUS ONLY (in-stock/compatible vs not).
        //     danger is a TRUE red, kept clearly redder than the warm brand
        //     orange so the two never blur on compatibility screens.
        // ==========================================================
        rb: {
          black:    "#0A0A0A",   // deepest — hero / full-bleed sections
          surface:  "#101112",   // page background
          elevated: "#17181A",   // cards / panels
          raised:   "#1F2123",   // hover / elevated card
          line:     "#2A2D2F",   // hairline borders
          silver:   "#8A8F90",   // muted / tertiary text
          mist:     "#C7CBCC",   // secondary text
          white:    "#F4F5F5",   // primary text on dark
          orange:      "#FF5A1F",// ★ THE accent (molten orange)
          "orange-deep": "#E24410", // hover / pressed / calmer fills
          "orange-ink":  "#160603", // text/icon on an orange fill
          "orange-light":"#D8420E", // accent on LIGHT backgrounds
          success:  "#22C55E",   // in stock / compatible
          danger:   "#E5484D",   // out of stock / incompatible (true red)
          warn:     "#EAB308",   // low stock / caution (yellow — off the orange)
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