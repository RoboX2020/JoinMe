import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                card: "var(--card)",
                'card-foreground': "var(--card-foreground)",
                'input-bg': "var(--input-bg)",
                'input-text': "var(--input-text)",
                border: "var(--border)",
                'header-bg': "var(--header-bg)",
            },
            boxShadow: {
                'float': '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            },
        },
    },
    plugins: [],
};
export default config;
