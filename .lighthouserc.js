const baseUrl = 'http://localhost:5601';

module.exports = {
  ci: {
    collect: {
      url: [`${baseUrl}`, `${baseUrl}/app/data-explorer/discover`, `${baseUrl}/app/dashboards`], // Add more URLs as needed
      startServerCommand: 'yarn start --no-base-path',
      numberOfRuns: 3,
      settings: {
        chromePath: require('puppeteer').executablePath(),
        chromeFlags: '--no-sandbox --disable-gpu --headless',
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        performance: ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        interactive: ['warn', { maxNumericValue: 5000 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'temporary-public-storage', // Required for GitHub integration
    },
  },
};

// target: 'filesystem',
// outputDir: process.env.LHCI_BASELINE ? './lhci-baseline' : './lhci-reports',
