/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const baseUrl = 'http://localhost:5601';

module.exports = {
  ci: {
    collect: {
      url: [
        `${baseUrl}/app/home`,
        `${baseUrl}/app/dashboards#/view/722b74f0-b882-11e8-a6d9-e546fe2bba5f`,
        `${baseUrl}/app/data-explorer/discover`,
        `${baseUrl}/app/visualize`,
      ], // Add more URLs as needed
      startServerCommand: 'yarn start --no-base-path',
      numberOfRuns: 2,
      settings: {
        chromePath: require('puppeteer').executablePath(),
        chromeFlags: '--no-sandbox --disable-gpu --headless',
        formFactor: 'desktop', // This will enforce the desktop view
        viewport: {
          width: 1280, // Optional: Set a specific width
          height: 800, // Optional: Set a specific height
        },
        screenEmulation: {
          // Disable mobile emulation
          disabled: true,
        },
      },
    },
    assert: {
      // Only the key assertions
      assertions: {
        // performance: ['warn', { minScore: 0.2 }], // Aggregates all key metrics into a single score.
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }], //	Indicates how fast the page starts loading.
        'speed-index': ['warn', { maxNumericValue: 20000 }], // Lower speed index = better perceived performance.
        // 'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }], // Critical for user-perceived load speed.
        // interactive: ['warn', { maxNumericValue: 5000 }], // Affects usability—page is responsive to user input.
        // 'total-blocking-time': ['warn', { maxNumericValue: 300 }], // Higher TBT makes the page feel sluggish.
        // 'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }], // Prevents janky UI movements during load.
      },
    },
    upload: {
      target: 'temporary-public-storage', // Required for GitHub integration
      githubStatusCheck: false,
    },
  },
};
