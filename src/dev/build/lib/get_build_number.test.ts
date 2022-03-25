/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { getBuildNumber } from './get_build_number';

const BUILD_NUMBER_ENV_KEY = 'BUILD_NUMBER';
const itif = process.env.CI === '1' ? it.skip : it;

describe('getBuildNumber', () => {
  let previousBuildNumber: string;

  beforeEach(() => {
    if (BUILD_NUMBER_ENV_KEY in process.env) {
      previousBuildNumber = process.env[BUILD_NUMBER_ENV_KEY] as string;
      delete process.env[BUILD_NUMBER_ENV_KEY];
    }
  });

  afterEach(() => {
    if (BUILD_NUMBER_ENV_KEY in process.env) {
      process.env[BUILD_NUMBER_ENV_KEY] = previousBuildNumber;
    }
  });

  it('returns env BUILD_NUMBER count', async () => {
    process.env.BUILD_NUMBER = '123';
    const buildNumber = await getBuildNumber();
    expect(buildNumber).toBe(123);
  });

  // If test is ran on the CI, it only gets 1 commit
  itif('returns git commit count', async () => {
    const buildNumber = await getBuildNumber();
    expect(buildNumber).toBeGreaterThan(1000);
  });
});
