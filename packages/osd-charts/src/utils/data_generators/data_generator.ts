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

import { Simple1DNoise } from './simple_noise';

/** @public */
export type RandomNumberGenerator = (
  min?: number,
  max?: number,
  fractionDigits?: number,
  inclusive?: boolean,
) => number;

function defaultRNG(min = 0, max = 1, fractionDigits = 0, inclusive = true) {
  const precision = Math.pow(10, Math.max(fractionDigits, 0));
  const scaledMax = max * precision;
  const scaledMin = min * precision;
  const offset = inclusive ? 1 : 0;
  const num = Math.floor(Math.random() * (scaledMax - scaledMin + offset)) + scaledMin;

  return num / precision;
}

/** @public */
export class DataGenerator {
  private randomNumberGenerator: RandomNumberGenerator;

  private generator: Simple1DNoise;

  private frequency: number;

  constructor(frequency = 500, randomNumberGenerator: RandomNumberGenerator = defaultRNG) {
    this.randomNumberGenerator = randomNumberGenerator;
    this.generator = new Simple1DNoise(this.randomNumberGenerator);
    this.frequency = frequency;
  }

  generateBasicSeries(totalPoints = 50, offset = 0, amplitude = 1) {
    const dataPoints = new Array(totalPoints).fill(0).map((_, i) => ({
      x: i,
      y: (this.generator.getValue(i) + offset) * amplitude,
    }));
    return dataPoints;
  }

  generateSimpleSeries(totalPoints = 50, groupIndex = 1, groupPrefix = '') {
    const group = String.fromCharCode(97 + groupIndex);
    const dataPoints = new Array(totalPoints).fill(0).map((_, i) => ({
      x: i,
      y: 3 + Math.sin(i / this.frequency) + this.generator.getValue(i),
      g: `${groupPrefix}${group}`,
    }));
    return dataPoints;
  }

  generateGroupedSeries(totalPoints = 50, totalGroups = 2, groupPrefix = '') {
    const groups = new Array(totalGroups)
      .fill(0)
      .map((group, i) => this.generateSimpleSeries(totalPoints, i, groupPrefix));
    return groups.reduce((acc, curr) => [...acc, ...curr]);
  }

  generateRandomSeries(totalPoints = 50, groupIndex = 1, groupPrefix = '') {
    const group = String.fromCharCode(97 + groupIndex);
    const dataPoints = new Array(totalPoints).fill(0).map(() => ({
      x: this.randomNumberGenerator(0, 100),
      y: this.randomNumberGenerator(0, 100),
      z: this.randomNumberGenerator(0, 100),
      g: `${groupPrefix}${group}`,
    }));
    return dataPoints;
  }

  generateRandomGroupedSeries(totalPoints = 50, totalGroups = 2, groupPrefix = '') {
    const groups = new Array(totalGroups)
      .fill(0)
      .map((group, i) => this.generateRandomSeries(totalPoints, i, groupPrefix));
    return groups.reduce((acc, curr) => [...acc, ...curr]);
  }
}
