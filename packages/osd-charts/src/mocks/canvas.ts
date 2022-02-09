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

/** @internal */
export const getMockCanvasContext2D = (): CanvasRenderingContext2D => {
  const ctx = document.createElement('canvas').getContext('2d');
  if (ctx) return ctx;

  throw new Error('Unable to create mock context');
};

/** @internal */
export const getMockCanvas = (): HTMLCanvasElement => {
  return document.createElement('canvas');
};
