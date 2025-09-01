/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const fs = require('fs');

const baseline = JSON.parse(fs.readFileSync('baselines/lighthouse_baseline.json', 'utf8'));

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
      numberOfRuns: 1,
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
      assertMatrix: [
        {
          matchingUrlPattern: '/app/home',
          assertions: {
            'first-contentful-paint': [
              'warn',
              {
                maxNumericValue: baseline['/app/home']['first-contentful-paint'],
              },
            ],
            'speed-index': ['warn', { maxNumericValue: baseline['/app/home']['speed-index'] }],
          },
        },
        {
          matchingUrlPattern: '/app/data-explorer/discover',
          assertions: {
            'first-contentful-paint': [
              'warn',
              {
                maxNumericValue: baseline['/app/data-explorer/discover']['first-contentful-paint'],
              },
            ],
            'speed-index': [
              'warn',
              { maxNumericValue: baseline['/app/data-explorer/discover']['speed-index'] },
            ],
          },
        },
        {
          matchingUrlPattern: '/app/visualize',
          assertions: {
            'first-contentful-paint': [
              'warn',
              {
                maxNumericValue: baseline['/app/visualize']['first-contentful-paint'],
              },
            ],
            'speed-index': ['warn', { maxNumericValue: baseline['/app/visualize']['speed-index'] }],
          },
        },
        {
          matchingUrlPattern: '/app/dashboards',
          assertions: {
            'first-contentful-paint': [
              'warn',
              {
                maxNumericValue: baseline['/app/dashboards']['first-contentful-paint'],
              },
            ],
            'speed-index': [
              'warn',
              { maxNumericValue: baseline['/app/dashboards']['speed-index'] },
            ],
          },
        },
      ],
    },
  },
  upload: {
    target: 'temporary-public-storage', // Required for GitHub integration
    githubStatusCheck: false,
  },
};
