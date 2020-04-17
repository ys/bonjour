const themeDir = __dirname + "/";

module.exports = {
  plugins: [
    require("@fullhuman/postcss-purgecss")({
      content: [
        themeDir + "../../public/**/*.html"
      ]
    }),
    require("tailwindcss")(themeDir + "tailwind.config.js"),
    require("autoprefixer")
  ]
};
