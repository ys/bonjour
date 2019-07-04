module.exports = {
  plugins: {
    autoprefixer: {
      browsers: [
        "last 2 versions",
        "Explorer >= 8",
      ]
    },
    '@fullhuman/postcss-purgecss': {
      content: [
        '**/*.html',
      ],
      whitelist: [/always-/, /max-/, "medium-zoom--open", "fullwidth", "vertical"]
    },
  },
}
