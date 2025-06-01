import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			screens: {
				xs: "480px",
			},
			colors: {
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
				"music-playing-1": {
					"0%, 100%": { height: "0.75rem" },
					"50%": { height: "1.25rem" },
				},
				"music-playing-2": {
					"0%, 100%": { height: "1.25rem" },
					"50%": { height: "0.75rem" },
				},
				"music-playing-3": {
					"0%, 100%": { height: "0.5rem" },
					"50%": { height: "1rem" },
				},
				"music-bar-1": {
					"0%, 100%": { height: "1rem" },
					"50%": { height: "0.5rem" },
				},
				"music-bar-2": {
					"0%, 100%": { height: "0.5rem" },
					"50%": { height: "0.75rem" },
				},
				"music-bar-3": {
					"0%, 100%": { height: "0.75rem" },
					"50%": { height: "1rem" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"music-playing-1": "music-playing-1 1s ease-in-out infinite",
				"music-playing-2": "music-playing-2 1s ease-in-out infinite 0.1s",
				"music-playing-3": "music-playing-3 1s ease-in-out infinite 0.2s",
				"music-bar-1": "music-bar-1 1.2s ease-in-out infinite",
				"music-bar-2": "music-bar-2 1.2s ease-in-out infinite 0.2s",
				"music-bar-3": "music-bar-3 1.2s ease-in-out infinite 0.4s",
			},
		},
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
