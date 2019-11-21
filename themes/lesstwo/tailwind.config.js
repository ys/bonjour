const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  theme: {
    screens: {
      sm: "577px",
      md: "768px",
      lg: "992px",
      xl: "1200px"
    },
    extend: {
      fontFamily: {
        serif: ["Minion", ...defaultTheme.fontFamily.serif],
        sans: ['"Source Sans Pro"', ...defaultTheme.fontFamily.sans]
      },
      fontSize: {
        xs: "0.875rem",
        sm: "1rem",
        base: "1.125rem",
        lg: "1.25rem",
        xl: "1.5rem",
        "2xl": "1.875rem",
        "3xl": "2.25rem",
        "4xl": "3rem",
        "5xl": "4rem",
        "6xl": "6rem"
      }
    }
  },
  variants: {}
};
