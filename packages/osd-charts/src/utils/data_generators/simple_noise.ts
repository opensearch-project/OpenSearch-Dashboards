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
 * under the License. */

export type RandomNumberGenerator = () => number;

export class Simple1DNoise {
  private maxVertices: number;
  private maxVerticesMask: number;
  private amplitude: number;
  private scale: number;
  private getRandomNumber: RandomNumberGenerator;

  constructor(randomNumberGenerator?: RandomNumberGenerator, maxVertices = 256, amplitude = 5.1, scale = 0.6) {
    this.getRandomNumber = randomNumberGenerator ? randomNumberGenerator : Math.random;
    this.maxVerticesMask = maxVertices - 1;
    this.amplitude = amplitude;
    this.scale = scale;
    this.maxVertices = maxVertices;
  }

  getValue(x: number) {
    const r = new Array(this.maxVertices).fill(0).map(this.getRandomNumber);
    const scaledX = x * this.scale;
    const xFloor = Math.floor(scaledX);
    const t = scaledX - xFloor;
    const tRemapSmoothstep = t * t * (3 - 2 * t);

    // tslint:disable-next-line:no-bitwise
    const xMin = xFloor & this.maxVerticesMask;
    // tslint:disable-next-line:no-bitwise
    const xMax = (xMin + 1) & this.maxVerticesMask;

    const y = this.lerp(r[xMin], r[xMax], tRemapSmoothstep);

    return y * this.amplitude;
  }

  private lerp(a: number, b: number, t: number) {
    return a * (1 - t) + b * t;
  }
}
