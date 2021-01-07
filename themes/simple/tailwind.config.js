const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require('tailwindcss/colors');

module.exports = {
  darkMode: "media",
  plugins: [require('@tailwindcss/typography'),],
  theme: {
    extend: {
      colors: {
        teal: colors.teal,
        orange: colors.orange,
        amber: colors.amber,
        bluegray: colors.blueGray,
        rose: colors.rose,
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
        accentblue: {
          100: '#E6F6FC',
          200: '#BFE9F8',
          300: '#99DCF3',
          400: '#4DC1EA',
          500: '#00A7E1',
          600: '#0096CB',
          700: '#006487',
          800: '#004B65',
          900: '#003244',
        },
        dark: "#2d2f34",
        darker: "#1F2023"
      }
    }
  }
};
