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
        serif: ["freight-text-pro", ...defaultTheme.fontFamily.serif]
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
  },
  variants: {}
};
