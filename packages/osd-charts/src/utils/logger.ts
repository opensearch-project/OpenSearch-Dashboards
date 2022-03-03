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

/* eslint-disable no-console */

/**
 * Helper class to assist with logging warnings
 *
 * @internal
 * @todo Add more helpful messages in dev for configuration errors
 */
export class Logger {
  static namespace = '[@elastic/charts]';

  /**
   * Log warning to console
   *
   * @param message
   * @param optionalParams
   */
  static warn(message?: any, ...optionalParams: any[]) {
    if (Logger.isDevelopment() && !Logger.isTest()) {
      console.warn(`${Logger.namespace} ${message}`, ...optionalParams);
    }
  }

  /**
   * Log expected value warning to console
   */
  static expected(message: any, expected: any, received: any) {
    if (Logger.isDevelopment() && !Logger.isTest()) {
      console.warn(
        `${Logger.namespace} ${message}`,
        `\n
  Expected: ${expected}
  Received: ${received}
`,
      );
    }
  }

  /**
   * Log error to console
   *
   * @param message
   * @param optionalParams
   */
  static error(message?: any, ...optionalParams: any[]) {
    if (Logger.isDevelopment() && !Logger.isTest()) {
      console.warn(`${Logger.namespace} ${message}`, ...optionalParams);
    }
  }

  /**
   * Determined development env
   *
   * @todo confirm this logic works
   * @todo add more robust logic
   */
  private static isDevelopment(): boolean {
    return process.env.NODE_ENV !== 'production';
  }

  /**
   * Determined development env
   *
   * @todo confirm this logic works
   * @todo add more robust logic
   */
  private static isTest(): boolean {
    return process.env.NODE_ENV === 'test';
  }
}

/* eslint-enable */
