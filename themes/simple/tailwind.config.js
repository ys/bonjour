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
        dark: "#2d2f34",
        darker: "#1F2023"
      },
      fontSize: {
        xs: "1rem",
        sm: "1.125rem",
        base: "1.25rem",
        lg: "1.5rem",
        xl: "1.875rem",
        "2xl": "2.25rem",
        "3xl": "3rem",
        "4xl": "4rem"
      }
    }
  }
};
