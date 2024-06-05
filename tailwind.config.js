import typography from "@tailwindcss/typography";
import daisyui from "daisyui";
/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{svelte,js,ts,html,css}"],
	theme: {
		extend: {},
	},
	plugins: [typography(), daisyui],
};
