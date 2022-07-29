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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import compactStringify from 'json-stringify-pretty-compact';
import { validateObject } from '@osd/std';

export class Utils {
  /**
   * If the 2nd array parameter in args exists, append it to the warning/error string value
   */
  static formatWarningToStr(...args: any[]) {
    let value = args[0];
    if (args.length >= 2) {
      try {
        if (typeof args[1] === 'string') {
          value += `\n${args[1]}`;
        } else {
          value += '\n' + compactStringify(args[1], { maxLength: 70 });
        }
      } catch (err) {
        // ignore
      }
    }
    return value;
  }

  static formatErrorToStr(...args: any[]) {
    let error: Error | string = args[0];
    if (!error) {
      error = 'ERR';
    } else if (error instanceof Error) {
      error = error.message;
    }
    return Utils.formatWarningToStr(error, ...Array.from(args).slice(1));
  }

  static handleNonStringIndex(index: unknown): string | undefined {
    return typeof index === 'string' ? index : undefined;
  }

  static handleInvalidQuery(query: unknown): object | null {
    if (Utils.isObject(query) && !Utils.checkForFunctionProperty(query as object)) {
      // Validating object against prototype pollution
      validateObject(query);
      return JSON.parse(JSON.stringify(query));
    }
    return null;
  }

  static isObject(object: unknown): boolean {
    return !!(object && typeof object === 'object' && !Array.isArray(object));
  }

  static checkForFunctionProperty(object: object): boolean {
    let result = false;
    Object.values(object).forEach((value) => {
      result =
        typeof value === 'function'
          ? true
          : Utils.isObject(value) && Utils.checkForFunctionProperty(value);
    });
    return result;
  }

  static handleInvalidDate(date: unknown): number | string | Date | null {
    if (typeof date === 'number') {
      return !isNaN(date) ? date : null;
    } else if (date instanceof Date || typeof date === 'string') {
      return date;
    }
    return null;
  }
}
