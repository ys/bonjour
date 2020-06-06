const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  plugins: [require("tailwindcss-dark-mode")()],
  variants: {
    backgroundColor: ['dark', 'dark-hover', 'dark-group-hover'],
    borderColor: ['dark', 'dark-focus', 'dark-focus-within'],
    textColor: ['dark', 'dark-hover', 'dark-active']
  },
  theme: {
    screens: {
      sm: "577px",
      md: "768px",
      lg: "992px",
      xl: "1200px"
    },
    extend: {
      colors: {
        sunray: {
          100: '#FDF8EE',
          200: '#FBECD5',
          300: '#F8E1BC',
          400: '#F2CB8A',
          500: '#EDB458',
          600: '#D5A24F',
          700: '#8E6C35',
          800: '#6B5128',
          900: '#47361A',
        },
        accent: {
          100: '#EEF4F4',
          200: '#D3E4E4',
          300: '#B9D3D4',
          400: '#85B3B4',
          500: '#509294',
          600: '#488385',
          700: '#305859',
          800: '#244243',
          900: '#182C2C',
        },
        dark: "#2d2f34",
        darker: "#1F2023"
      }
    }
  }
};
