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

import 'jest-extended'; // https://github.com/jest-community/jest-extended

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /**
       * Node environment
       */
      NODE_ENV: 'development' | 'production' | 'test';
      /**
       * Port used for dev servers including:
       *  - storybook
       *  - playground
       */
      PORT?: string;
      /**
       * Timezone flag used on jest.ts.config.js
       */
      TZ: string;
      /**
       * Flag used to enable custom configuration under visual regression tests.
       *
       * Including:
       * - disabling animations
       * - preloading icons
       * - setting rng seed
       */
      VRT: string;
      /**
       * Flag used to enable the legacy, Storybook, server for visual regression tests.
       */
      LEGACY_VRT_SERVER: string;
      /**
       * Flag used to connect an existing local server for visual regression tests.
       */
      LOCAL_VRT_SERVER: string;
      /**
       * Flag used to enable debug state on visual regression test runner
       */
      DEBUG: string;
      /**
       * String used for seeding a random number generator used in storybook and test files
       *
       * When seeded all rng use a deterministic random set of numbers.
       * When no seed is provided a positive _random_ number set will be used.
       */
      RNG_SEED: string;
    }
  }
}
