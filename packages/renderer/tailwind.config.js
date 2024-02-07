/** @type {import('tailwindcss').Config} */

export default {
  //   content: {
  //     relative: true,
  //     files: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}']
  //   },
  content: ['./packages/renderer/index.html', './packages/renderer/src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {}
  },
  plugins: []
}
