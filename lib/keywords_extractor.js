var customExtractor = {
  domain: '*',
  extend: {
    keylwords: {
      selectors: ['meta[name="keywords"]'],
      allowMultiple: true
    },
  },
};

module.exports = customExtractor;
