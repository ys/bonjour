const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require('tailwindcss/colors');
fs = require('fs');

const classes = JSON.parse(fs.readFileSync("./hugo_stats.json"))["htmlElements"]["classes"]

module.exports = {
  darkMode: false,
  content: {
    files: [
      './themes/simple/layouts/**/*.html',
      './content/**/*.md',
      './public/**/*.html',
      './themes/simple/assets/**/*.js',
      './hugo_stats.json'
    ],
  },
  safelist: [
    {
      pattern: /bg-.*/,
    },
    {
      pattern: /hover:bg-.*/,
    },
  ],
  plugins: [
    require('@catppuccin/tailwindcss'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/forms'),
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: [
          "iA Writer Quattro",
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
