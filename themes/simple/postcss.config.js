const themeDir = __dirname + "/";

const purgecss = require('@fullhuman/postcss-purgecss')({
    content: [ '../../hugo_stats.json' ],
    defaultExtractor: (content) => {
        let els = JSON.parse(content).htmlElements;
        return els.tags.concat(els.classes, els.ids);
    }
});

module.exports = {
  plugins: [
    require("tailwindcss")(themeDir + "tailwind.config.js"),
    require("autoprefixer"),
    ...(process.env.HUGO_ENVIRONMENT === 'production' ? [ purgecss ] : [])
  ]
};
