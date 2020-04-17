const themeDir = __dirname + "/";

module.exports = {
  plugins: [
    require("tailwindcss")(themeDir + "tailwind.config.js"),
    require("autoprefixer"),
    require("@fullhuman/postcss-purgecss")({
      content: [
        themeDir + "../public/**/*.html"
      ]
    })
  ]
};
