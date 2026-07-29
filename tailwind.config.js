/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#E2E8ED",
        surface: "#FFFFFF",
        border: "#DCE3E8",
        borderStrong: "#C2CDD5",
        ink: "#101A2B",
        dim: "#5B6B7C",
        faint: "#94A3AF",
        chrome: "#052560",
        chromeAlt: "#0B3172",
        chromeLine: "#1A3C7A",
        chromeInk: "#F2F5F7",
        chromeFaint: "#8FA0B8",
        accent: "#2FBF95",
        accentSoft: "#E1F7EF",
        success: "#1F8A6F",
        successSoft: "#E6F5F0",
        warn: "#C08A2E",
        warnSoft: "#FAF1DC",
        danger: "#B33F3F",
        dangerSoft: "#F8EAEA",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "sans-serif"],
        display: ["Fraunces", "serif"],
      },
    },
  },
  plugins: [],
};
