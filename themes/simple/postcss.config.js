const themeDir = __dirname + "/";

module.exports = {
  plugins: [
    require("tailwindcss")(themeDir + "tailwind.config.js"),
    require("autoprefixer"),
    process.env.HUGO_ENVIRONMENT === 'production'
    ?  require("@fullhuman/postcss-purgecss")({
      content: [
        themeDir + "../../public/**/*.html"
      ],
      options: {
        safelist: [
          /max-w-xl/
        ]
      }
    }) : null
  ]
};
