/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Math.js Wrapper - Low-level expression evaluator
 *
 * This module provides a thin, security-hardened wrapper around the Math.js library.
 * It is responsible ONLY for evaluating mathematical expressions safely.
 *
 * Purpose:
 * - Configure Math.js once with security restrictions
 * - Provide simple evaluate(expression, scope) function
 * - Block dangerous Math.js functions (import, parse, evaluate, etc.)
 *
 * Server-side equivalent: server/lib/vis_data/response_processors/series/evaluate.ts
 *
 * Related file: process_math_series.js (uses this module to evaluate TSVB math expressions)
 *
 * Example usage:
 *   evaluate('2 + 3')  // Returns: 5
 *   evaluate('params.a / params.b', { params: { a: 10, b: 2 } })  // Returns: 5
 */

import { create, all } from 'mathjs';

const math = create(all);
const mathEvaluate = math.evaluate;
export const MATH_THROW_MSG = 'Math.js function is disabled';

let isConfigured = false;

/**
 * Configures Math.js with security restrictions.
 * This function is idempotent - calling it multiple times is safe.
 *
 * Security restrictions applied:
 * - Disables import() - prevents arbitrary code injection
 * - Disables createUnit() - prevents unit definition manipulation
 * - Disables evaluate() - prevents nested evaluation
 * - Disables parse() - prevents AST manipulation
 * - Disables simplify() - prevents formula manipulation
 * - Disables derivative() - prevents calculus operations
 *
 * These restrictions match server-side configuration exactly.
 */
export function configureMathJs() {
  if (isConfigured) return;

  // Apply same security restrictions as server
  // See: server/lib/vis_data/response_processors/series/evaluate.ts
  // Note: We capture mathEvaluate reference BEFORE applying restrictions,
  // so we can still use it internally while blocking it from user expressions
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

  isConfigured = true;
}

/**
 * Evaluates a mathematical expression with given scope.
 *
 * @param {string} expression - The mathematical expression to evaluate (e.g., 'params.a + params.b')
 * @param {Object} scope - Variables available in the expression (e.g., { params: { a: 1, b: 2 } })
 * @returns {number|Object} The result of the evaluation
 *
 * @example
 * evaluate('2 + 3')  // 5
 * evaluate('params.x * 2', { params: { x: 5 } })  // 10
 * evaluate('divide(params.a, params.b)', { params: { a: 10, b: 2 } })  // 5
 */
export function evaluate(expression, scope = {}) {
  if (!isConfigured) {
    configureMathJs();
  }
  return mathEvaluate(expression, scope);
}
