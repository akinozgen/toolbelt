module.exports = {
  content: ['./src/renderer/index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base:     'var(--bg-base)',
        surface:  'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        hover:    'var(--bg-hover)',
        line:     'var(--border)',
        primary: {
          DEFAULT: 'var(--primary)',
          hover:   'var(--primary-hover)',
          subtle:  'var(--primary-subtle)',
        },
        secondary: 'var(--secondary)',
        accent:    'var(--accent)',
        content: {
          DEFAULT: 'var(--text-primary)',
          muted:   'var(--text-secondary)',
          faint:   'var(--text-muted)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          subtle:  'var(--danger-subtle)',
        },
        success: 'var(--success)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
