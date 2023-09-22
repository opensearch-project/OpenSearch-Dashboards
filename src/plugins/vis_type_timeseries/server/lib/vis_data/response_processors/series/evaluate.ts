/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { create, all } from 'mathjs';

const math = create(all);
export const evaluate = math.evaluate;
export const MATH_THROW_MSG = 'Math.js function is disabled';

math.import(
  {
    import() {
      throw new Error(MATH_THROW_MSG);
    },
    createUnit() {
      throw new Error(MATH_THROW_MSG);
    },
    evaluate() {
      throw new Error(MATH_THROW_MSG);
    },
    parse() {
      throw new Error(MATH_THROW_MSG);
    },
    simplify() {
      throw new Error(MATH_THROW_MSG);
    },
    derivative() {
      throw new Error(MATH_THROW_MSG);
    },
  },
  { override: true }
);
