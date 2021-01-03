const themeDir = __dirname + "/";

module.exports = {
  plugins: [
    require("@fullhuman/postcss-purgecss")({
      content: [
        themeDir + "../../public/**/*.html"
      ],
      safelist: [
       /mode-dark/,
       /post/,
       /photoset/,
       /always/,
       /max/
      ]
    }),
    require("tailwindcss")(themeDir + "tailwind.config.js"),
    require("autoprefixer")
  ]
};
