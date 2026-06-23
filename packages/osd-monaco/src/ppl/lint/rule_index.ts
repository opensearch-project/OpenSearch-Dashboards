/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParserRuleContext, ParseTree, TerminalNode } from 'antlr4ng';
import { SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';

export type RuleNameToIndex = (name: string) => number;

// Duck-type guards: `instanceof` breaks across duplicate antlr4ng bundles in workers.

export function isRuleNode(node: unknown): node is ParserRuleContext {
  return (
    node != null &&
    typeof (node as any).ruleIndex === 'number' &&
    (node as any).ruleIndex >= 0 &&
    'children' in (node as any)
  );
}

export function isTerminalNode(node: unknown): node is TerminalNode {
  return (
    node != null &&
    typeof (node as any).symbol === 'object' &&
    (node as any).symbol != null &&
    !('ruleIndex' in (node as any) && (node as any).ruleIndex >= 0)
  );
}

let compiledRuleNameToIndexMap: Map<string, number> | undefined;

function getCompiledRuleNameToIndexMap(): Map<string, number> {
  if (!compiledRuleNameToIndexMap) {
    compiledRuleNameToIndexMap = new Map<string, number>();
    const ruleNames = SimplifiedOpenSearchPPLParser.ruleNames;
    for (let i = 0; i < ruleNames.length; i++) {
      compiledRuleNameToIndexMap.set(ruleNames[i], i);
    }
  }
  return compiledRuleNameToIndexMap;
}

export function createCompiledRuleNameToIndex(): RuleNameToIndex {
  const map = getCompiledRuleNameToIndexMap();
  return (name: string) => map.get(name) ?? -1;
}

export function createRuntimeRuleNameToIndex(
  runtimeRuleNameToIndex: Map<string, number>
): RuleNameToIndex {
  return (name: string) => runtimeRuleNameToIndex.get(name) ?? -1;
}

export function findChildByRule(
  ctx: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex,
  ruleName: string
): ParserRuleContext | undefined {
  const idx = ruleNameToIndex(ruleName);
  if (idx === -1) {
    return undefined;
  }
  const children = ctx.children ?? [];
  for (const child of children) {
    if (isRuleNode(child) && child.ruleIndex === idx) {
      return child as ParserRuleContext;
    }
  }
  return undefined;
}

export function findAllChildrenByRule(
  ctx: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex,
  ruleName: string
): ParserRuleContext[] {
  const idx = ruleNameToIndex(ruleName);
  if (idx === -1) {
    return [];
  }
  const children = ctx.children ?? [];
  return children.filter((c): c is ParserRuleContext => isRuleNode(c) && c.ruleIndex === idx);
}

export function findAllDescendantsByRule(
  ctx: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex,
  ruleName: string
): ParserRuleContext[] {
  const idx = ruleNameToIndex(ruleName);
  if (idx === -1) {
    return [];
  }
  const matches: ParserRuleContext[] = [];
  const stack: ParseTree[] = [...(ctx.children ?? [])];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (isRuleNode(node)) {
      if (node.ruleIndex === idx) {
        matches.push(node as ParserRuleContext);
      }
      if (node.children) {
        stack.push(...node.children);
      }
    }
  }
  return matches;
}

export const DOTTED_PATH_RULES = ['qualifiedName', 'wcQualifiedName'];

export function collectDottedPathNodes(
  ctx: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex
): ParserRuleContext[] {
  const seen = new Set<number>();
  const result: ParserRuleContext[] = [];
  for (const ruleName of DOTTED_PATH_RULES) {
    for (const node of findAllDescendantsByRule(ctx, ruleNameToIndex, ruleName)) {
      if (node.getText().indexOf('.') === -1) {
        continue;
      }
      const startIndex = node.start?.start ?? -1;
      if (seen.has(startIndex)) {
        continue;
      }
      seen.add(startIndex);
      result.push(node);
    }
  }
  return result;
}

export function getTokenText(ctx: ParserRuleContext): string {
  const children = ctx.children ?? [];
  return children
    .filter((c): c is TerminalNode => isTerminalNode(c))
    .map((c) => c.getText())
    .join('');
}
