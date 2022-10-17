const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    './themes/simple/layouts/**/*.html',
    './content/**/*.md',
    './public/**/*.html',
    './themes/simple/assets/**/*.js',
    './hugo_stats.json'
  ],
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp'),
  ],
  variants: {
    extend: {
      typography: ["dark"],
    }
  },
  theme: {
    extend: {
      fontFamily: {
        mono: [
          "SFMono-Regular",
          "-ui-monospace",
          "ui-monospace",
          "Monaco",
          "Andale Mono",
          "Ubuntu Mono",
          "monospace"
        ],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif"
        ],
        serif: [
          "-apple-system-ui-serif",
          "Iowan Old Style",
          "Apple Garamond",
          "Baskerville",
          "Times New Roman",
          "Droid Serif",
          "Times",
          "Source Serif Pro",
          "serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol"
        ]
      },
      colors: {
        cascade: colors.sky,
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
        forest: {
          50: "#57b399",
          100: "#4da98f",
          200: "#439f85",
          300: "#39957b",
          400: "#2f8b71",
          500: "#258167",
          600: "#1b775d",
          700: "#116d53",
          800: "#076349",
          900: "#00593f"
        },
        dark: "#2d2f34",
        darker: "#1F2023"
      },
      typography: (theme) => ({
        light: {
          css: [
            {
              color: theme('colors.gray.100'),
              '[class~="lead"]': {
                color: theme('colors.gray.300'),
              },
              strong: {
                color: theme('colors.white'),
              },
              'ol > li::before': {
                color: theme('colors.gray.400'),
              },
              'ul > li::before': {
                backgroundColor: theme('colors.gray.600'),
              },
              hr: {
                borderColor: theme('colors.gray.200'),
              },
              blockquote: {
                color: theme('colors.gray.200'),
                borderLeftColor: theme('colors.gray.600'),
              },
              h1: {
                color: theme('colors.white'),
              },
              h2: {
                color: theme('colors.white'),
              },
              h3: {
                color: theme('colors.white'),
              },
              h4: {
                color: theme('colors.white'),
              },
              'figure figcaption': {
                color: theme('colors.gray.400'),
              },
              code: {
                color: theme('colors.white'),
              },
              'a code': {
                color: theme('colors.white'),
              },
              pre: {
                color: theme('colors.gray.200'),
                backgroundColor: theme('colors.gray.800'),
              },
              thead: {
                color: theme('colors.white'),
                borderBottomColor: theme('colors.gray.400'),
              },
              'tbody tr': {
                borderBottomColor: theme('colors.gray.600'),
              },
            },
          ],
        },
        DEFAULT: {
          css: {
            img: {
              marginTop: 0,
              marginBottom: 0
            }
          }
        }
      }),
    }
  }
}
