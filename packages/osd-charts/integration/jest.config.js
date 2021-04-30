/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const jestPuppeteerDocker = require('jest-puppeteer-docker/jest-preset');
const jestPuppeteer = require('jest-puppeteer/jest-preset');
const tsPreset = require('ts-jest/jest-preset');

const { debug } = require('./config');

module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest_env_setup.ts'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
    /*
     * The window and HTMLElement globals are required to use @elastic/eui with VRT
     *
     * The jest-puppeteer-docker env extends a node test environment and not jsdom test environment.
     * Some EUI components that are included in the bundle, but not used, require the jsdom setup.
     * To bypass these errors we are just mocking both as empty objects.
     */
    window: {},
    HTMLElement: {},
  },
  ...(debug ? jestPuppeteer : jestPuppeteerDocker),
  ...tsPreset,
};
