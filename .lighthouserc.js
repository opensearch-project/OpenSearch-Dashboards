const baseUrl = 'http://localhost:5601';

module.exports = {
  ci: {
    collect: {
      url: [
        `${baseUrl}/app/home`,
        `${baseUrl}/app/dashboards#/view/722b74f0-b882-11e8-a6d9-e546fe2bba5f`,
        `${baseUrl}/app/data-explorer/discover`,
      ], // Add more URLs as needed
      startServerCommand: 'yarn start --no-base-path',
      numberOfRuns: 2,
      settings: {
        chromePath: require('puppeteer').executablePath(),
        chromeFlags: '--no-sandbox --disable-gpu --headless',
      },
    },
    assert: {
      // Only the key assertions you care about
      assertions: {
        performance: ['warn', { minScore: 0.2 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        interactive: ['warn', { maxNumericValue: 5000 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'temporary-public-storage', // Required for GitHub integration
      githubStatusCheck: false,
    },
  },
};
