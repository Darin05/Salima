module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'cream': '#FAF3EF',
        'sand': '#F1E5DC',
        'blush': '#F6E7E1',
        'dusty-rose': '#D8A39B',
        'rose-deep': '#BE7D75',
        'plum': '#4D3539',
        'plum-soft': '#7A5C60',
        'gold': '#C6A15B',
      },
      fontFamily: {
        'playfair': ['Playfair Display', 'serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
        'messiri': ['El Messiri', 'sans-serif'],
        'tajawal': ['Tajawal', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.625rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
