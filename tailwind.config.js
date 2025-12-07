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
          purple: "#4E2C8B",     // Deep Matte Purple
          blue: "#265DAB",       // Muted Electric Blue
          silver: "#A0A0A0",     // Matte Silver Gray
          text: "#D0D0D0",       // Warm Gray (Text)
          burgundy: "#8C2F39",   // Matte Burgundy
          sand: "#C2BEBE",       // Sandstone Beige
        }
      },
      fontFamily: {
        saira: ["var(--font-saira)", "sans-serif"],
        orbitron: ["var(--font-orbitron)", "sans-serif"],
      },
    },
  },
  plugins: [],
};