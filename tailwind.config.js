// Tailwind content paths and theme extensions for Paperboyy server-rendered EJS views.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    path.join(__dirname, 'src/views/**/*.ejs'),
    path.join(__dirname, 'ui/**/*.js'),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
