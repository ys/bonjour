const themeDir = __dirname + "/";

plugins = []
if (process.env.HUGO_ENVIRONMENT === 'production') {
  plugins = [
    require("@fullhuman/postcss-purgecss")({
      content: [
        themeDir + "../../public/**/*.html"
      ],
      options: {
        safelist: [
          /content-/,
          /post/,
          /photoset/,
          /always/,
          /max/
        ]
      }
    })]
}
plugins.push(require("tailwindcss")(themeDir + "tailwind.config.js"))
plugins.push(require("autoprefixer"))
module.exports = {
  plugins: plugins
};
