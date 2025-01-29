module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:5601'], // Adjust to OpenSearch Dashboards URL
      startServerCommand: 'yarn start',
      numberOfRuns: 3,
      settings: {
        chromePath: require('puppeteer').executablePath(),
        chromeFlags: '--no-sandbox --disable-gpu',
      },
    },
    assert: {
      assertions: {
        performance: ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage', // Change to a proper CI storage later
    },
  },
};
