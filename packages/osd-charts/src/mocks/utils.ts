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

import seedrandom from 'seedrandom';

import { DataGenerator, RandomNumberGenerator } from '../utils/data_generators/data_generator';

/**
 * Forces object to be partial type for mocking tests
 *
 * SHOULD NOT BE USED OUTSIDE OF TESTS!!!
 *
 * @param obj partial object type
 * @internal
 */
export const forcedType = <T extends Record<string, unknown>>(obj: Partial<T>): T => obj as T;

/**
 * Returns rng seed from `process.env`
 * @internal
 */
export const getRNGSeed = (fallback?: string): string | undefined =>
  process.env.RNG_SEED ?? (process.env.VRT ? 'elastic-charts' : fallback);

/**
 * Returns rng function with optional `min`, `max` and `fractionDigits` params
 *
 * @param string seed for deterministic algorithm
 * @internal
 */
export const getRandomNumberGenerator = (seed = getRNGSeed()): RandomNumberGenerator => {
  const rng = seedrandom(seed);

  /**
   * Random number generator
   *
   * @param  {} min=0
   * @param  {} max=1
   * @param  {} fractionDigits=0
   */
  return function randomNumberGenerator(min = 0, max = 1, fractionDigits = 0, inclusive = true) {
    const precision = Math.pow(10, Math.max(fractionDigits, 0));
    const scaledMax = max * precision;
    const scaledMin = min * precision;
    const offset = inclusive ? 1 : 0;
    const num = Math.floor(rng() * (scaledMax - scaledMin + offset)) + scaledMin;

    return num / precision;
  };
};

/** @internal */
export class SeededDataGenerator extends DataGenerator {
  constructor(frequency = 500) {
    super(frequency, getRandomNumberGenerator());
  }
}
