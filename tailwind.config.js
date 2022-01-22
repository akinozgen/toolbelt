module.exports = {
  purge: ['./src/renderer/index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {},
  variants: {
    extend: {}
  },
  plugins: [require('daisyui'), require('@tailwindcss/typography')]
};
