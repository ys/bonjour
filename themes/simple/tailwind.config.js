const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require('tailwindcss/colors');

module.exports = {
  darkMode: "media",
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/aspect-ratio'),
  ],
  variants: {
    extend: {
      typography: ["dark"],
    }
  },
  theme: {
    extend: {
      fontFamily: {
        mono: ["ia-writer-quattro"],
      },
      colors: {
        gray: colors.warmGray,
        indigo: colors.indigo,
        teal: colors.teal,
        orange: colors.orange,
        amber: colors.amber,
        bluegray: colors.blueGray,
        rose: colors.rose,
        red: colors.red,
        bluewhale: {
          50: '#F2F4F6',
          100: '#E6E9EC',
          200: '#BFC9D0',
          300: '#99A8B3',
          400: '#4D677B',
          500: '#002642',
          600: '#00223B',
          700: '#001D32',
          800: '#001728',
          900: '#001320'
        },
        cascade: {
          100: '#F4F7F6',
          200: '#E4ECE9',
          300: '#D4E0DC',
          400: '#B3C8C1',
          500: '#93B1A7',
          600: '#849F96',
          700: '#6E857D',
          800: '#586A64',
          900: '#485752'
        },
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
      },
      typography: {
        DEFAULT: {
          css: {
            img: {
              marginTop: 0,
              marginBottom: 0
            }
          }
        }
      }
    }
  }
};
