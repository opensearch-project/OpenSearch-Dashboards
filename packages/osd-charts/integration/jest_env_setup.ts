import { configureToMatchImageSnapshot } from 'jest-image-snapshot';

const customConfig = { threshold: 0.01 };
export const toMatchImageSnapshot = configureToMatchImageSnapshot({
  customDiffConfig: customConfig,
  failureThreshold: 0.005,
  failureThresholdType: 'percent',
});

expect.extend({ toMatchImageSnapshot });

export const JEST_TIMEOUT = 10000;
jest.setTimeout(JEST_TIMEOUT);
