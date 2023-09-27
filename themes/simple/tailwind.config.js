const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require('tailwindcss/colors');
fs = require('fs');

const classes = JSON.parse(fs.readFileSync("./hugo_stats.json"))["htmlElements"]["classes"]

module.exports = {
  content: {
    files: [
      './themes/simple/layouts/**/*.html',
      './content/**/*.md',
      './public/**/*.html',
      './themes/simple/assets/**/*.js',
      './hugo_stats.json'
    ],
  },
  safeList: classes.concat([{ pattern: /hover:bg-\[.*\]/}]),
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/forms'),
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
          "berkeley",
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
        fire: "#DD614A",
        coral: "#FF7477",
        tuscan: "#972D07",
        sunray: '#EDC758',
        accent: '#EDC758',
        forest: "#4C9F70",
        purpleheart: "#0d2fef",
        jazzberry: "#b0014a",
        rose: "#FF206E",
        teal: "teal",
        ocean: "#226ECE",
        indigo: "#2B4162",
        dark: "#2d2f34",
        darker: "#1F2023"
      },
      typography: (theme) => ({
        sm: {
          css: {
            a: {
              color: 'var(--tw-prose-body)',
            },
            picture: {
              marginTop: 0,
              marginBottom: 0
            },
            img: {
              marginTop: 0,
              marginBottom: 0
            }
          }
        },
        DEFAULT: {
          css: {
            a: {
              color: 'var(--tw-prose-body)',
            },
            picture: {
              marginTop: 0,
              marginBottom: 0
            },
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
