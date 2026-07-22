/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseExpression } from 'vega-expression';

interface ValidationResult {
  expression: string;
  reason: string;
  location: string;
}

/**
 * Properties that should never be accessed in Vega expressions.
 * These allow DOM traversal from the Vega dataflow to the window object.
 *
 * Note: We intentionally exclude common data field names like 'children',
 * 'parentNode', 'firstChild', 'lastChild' which are used in Vega tree/hierarchy
 * data transforms. The critical exploit chain requires 'ownerDocument' → 'defaultView'
 * to reach the window object, so blocking those is sufficient.
 */
const BLOCKED_PROPERTIES = new Set([
  // DOM traversal to window (critical exploit path)
  'ownerDocument',
  'defaultView',
  'contentDocument',
  'contentWindow',
  'view', // event.view → window
  // DOM manipulation methods
  'innerHTML',
  'outerHTML',
  'insertAdjacentHTML',
  'createElement',
  'createElementNS',
  'getElementById',
  'getElementsByClassName',
  'getElementsByTagName',
  'querySelector',
  'querySelectorAll',
  // Prototype pollution
  '__proto__',
  'prototype',
  'constructor',
]);

/**
 * Global identifiers that should never be accessed directly in expressions.
 */
const BLOCKED_IDENTIFIERS = new Set([
  'window',
  'document',
  'global',
  'globalThis',
  'top',
  'parent',
  'frames',
  'self',
  'constructor',
]);

/**
 * Function names that should never be called in expressions.
 */
const BLOCKED_FUNCTIONS = new Set([
  'eval',
  'Function',
  'setTimeout',
  'setInterval',
  'setImmediate',
  'execScript',
  'atob',
  'btoa',
]);

interface ASTNode {
  type: string;
  name?: string;
  value?: any;
  object?: ASTNode;
  property?: ASTNode;
  computed?: boolean;
  callee?: ASTNode;
  arguments?: ASTNode[];
  elements?: ASTNode[];
  properties?: ASTNode[];
  key?: ASTNode;
  test?: ASTNode;
  consequent?: ASTNode;
  alternate?: ASTNode;
  left?: ASTNode;
  right?: ASTNode;
  argument?: ASTNode;
  operator?: string;
}

/**
 * Extract the property name from a MemberExpression node.
 * Handles both dot notation (node.property.name) and bracket notation with literals (node.property.value).
 */
function getPropertyName(node: ASTNode): string | null {
  if (!node.property) return null;
  if (!node.computed && node.property.type === 'Identifier') {
    return node.property.name || null;
  }
  if (
    node.computed &&
    node.property.type === 'Literal' &&
    typeof node.property.value === 'string'
  ) {
    return node.property.value;
  }
  return null;
}

/**
 * Recursively walk all nodes in the AST and invoke the visitor function on each.
 */
function walkAst(node: ASTNode | null | undefined, visitor: (n: ASTNode) => void): void {
  if (!node || typeof node !== 'object') return;

  visitor(node);

  switch (node.type) {
    case 'MemberExpression':
      walkAst(node.object, visitor);
      if (node.computed) {
        walkAst(node.property, visitor);
      }
      break;
    case 'CallExpression':
      walkAst(node.callee, visitor);
      node.arguments?.forEach((arg) => walkAst(arg, visitor));
      break;
    case 'ArrayExpression':
      node.elements?.forEach((el) => walkAst(el, visitor));
      break;
    case 'ObjectExpression':
      node.properties?.forEach((prop) => walkAst(prop, visitor));
      break;
    case 'Property':
      if (node.computed) {
        walkAst(node.key, visitor);
      }
      walkAst(node.value, visitor);
      break;
    case 'BinaryExpression':
    case 'LogicalExpression':
      walkAst(node.left, visitor);
      walkAst(node.right, visitor);
      break;
    case 'UnaryExpression':
      walkAst(node.argument, visitor);
      break;
    case 'ConditionalExpression':
      walkAst(node.test, visitor);
      walkAst(node.consequent, visitor);
      walkAst(node.alternate, visitor);
      break;
    // Identifier and Literal are leaf nodes — no children to walk
    default:
      break;
  }
}

/**
 * Check if an expression string contains dangerous patterns by parsing it into an AST
 * and walking the tree to detect blocked property access, identifiers, and function calls.
 */
function checkExpressionAst(expression: string, location: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  let ast: ASTNode;
  try {
    ast = parseExpression(expression) as unknown as ASTNode;
  } catch (e) {
    // If the expression doesn't parse, Vega will reject it at render time anyway
    return results;
  }

  walkAst(ast, (node: ASTNode) => {
    // Check MemberExpression for blocked property access
    if (node.type === 'MemberExpression') {
      const propName = getPropertyName(node);
      if (propName && BLOCKED_PROPERTIES.has(propName)) {
        results.push({
          expression,
          reason: `Blocked property access: "${propName}"`,
          location,
        });
      }
      // Block computed member access with non-literal expressions (e.g., string
      // concatenation or function calls used to obfuscate property names)
      if (node.computed && propName === null) {
        const prop = node.property;
        if (prop && prop.type !== 'Literal' && prop.type !== 'Identifier') {
          results.push({
            expression,
            reason: `Blocked dynamic computed property access`,
            location,
          });
        }
      }
    }

    // Check Identifier nodes for blocked globals
    // Only block top-level identifiers — property names in non-computed
    // MemberExpressions are no longer visited (fixed in walkAst above)
    if (node.type === 'Identifier' && node.name && BLOCKED_IDENTIFIERS.has(node.name)) {
      results.push({
        expression,
        reason: `Blocked identifier: "${node.name}"`,
        location,
      });
    }

    // Check CallExpression for blocked function calls
    if (node.type === 'CallExpression' && node.callee) {
      let calleeName: string | null = null;
      if (node.callee.type === 'Identifier') {
        calleeName = node.callee.name || null;
      }
      // Also check method-style calls like obj.eval(...) or obj.setTimeout(...)
      if (node.callee.type === 'MemberExpression') {
        calleeName = getPropertyName(node.callee);
      }
      if (calleeName && BLOCKED_FUNCTIONS.has(calleeName)) {
        results.push({
          expression,
          reason: `Blocked function call: "${calleeName}"`,
          location,
        });
      }
    }
  });

  return results;
}

/**
 * Validate Vega spec expressions using AST-based analysis to block dangerous patterns
 * that could lead to XSS or code execution.
 *
 * This function traverses the spec object, finds all expression fields, parses them
 * into ASTs, and checks for dangerous property access chains regardless of dot vs
 * bracket notation.
 */
export function validateVegaExpression(spec: Record<string, any>): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Fields that typically contain Vega expressions
  const expressionFields = ['expr', 'update', 'test', 'calculate', 'filter', 'signal'];

  function traverse(obj: Record<string, any>, path = '') {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        traverse(item, `${path}[${index}]`);
      });
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      // Check if this is an expression field
      if (expressionFields.includes(key) && typeof value === 'string') {
        const expressionResults = checkExpressionAst(value, currentPath);
        results.push(...expressionResults);
      }

      // Recursively check nested objects
      traverse(value, currentPath);
    }
  }

  traverse(spec);
  return results;
}
