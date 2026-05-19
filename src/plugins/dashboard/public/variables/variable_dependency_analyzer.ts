/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Variable, VariableType, VariableUtils } from './types';

/**
 * Dependency relationship between variables
 */
export interface VariableDependency {
  /** Variable that has the dependency */
  from: string;
  /** Variable that is depended upon */
  to: string;
}

/**
 * Dependency analysis result for a variable
 */
export interface VariableDependencyInfo {
  /** Variable name */
  name: string;
  /** Variables this variable depends on (appears in its query) */
  dependencies: string[];
  /** Variables that depend on this variable */
  dependents: string[];
  /** Whether this variable has any issues */
  hasIssues: boolean;
  /** Issues detected for this variable */
  issues: DependencyIssue[];
}

/**
 * Types of dependency issues
 */
export enum DependencyIssueType {
  /** Variable references itself */
  SelfReference = 'self-reference',
  /** Variable references another variable that comes after it (order violation) */
  ForwardReference = 'forward-reference',
  /** Circular dependency detected */
  CircularDependency = 'circular-dependency',
  /** Variable referenced does not exist */
  MissingReference = 'missing-reference',
}

/**
 * A dependency issue
 */
export interface DependencyIssue {
  type: DependencyIssueType;
  message: string;
  /** Variables involved in the issue */
  relatedVariables: string[];
}

/**
 * Complete dependency analysis result
 */
export interface DependencyAnalysisResult {
  /** Dependency information for each variable */
  variables: Map<string, VariableDependencyInfo>;
  /** All dependency edges */
  dependencies: VariableDependency[];
  /** Circular dependency chains detected */
  circularChains: string[][];
}

/**
 * Analyzer for variable dependencies
 */
export class VariableDependencyAnalyzer {
  /**
   * Build dependency map from variables
   */
  private static buildDependencyMap(
    variables: Variable[]
  ): Map<string, { variable: Variable; index: number; dependencies: string[] }> {
    const map = new Map<string, { variable: Variable; index: number; dependencies: string[] }>();

    variables.forEach((variable, index) => {
      let dependencies: string[] = [];

      if (variable.type === VariableType.Query) {
        dependencies = VariableUtils.extractVariableNames(variable.query);
      }

      map.set(variable.name, { variable, index, dependencies });
    });

    return map;
  }

  /**
   * Normalize a circular chain to a canonical form for deduplication
   * The canonical form starts with the lexicographically smallest variable
   */
  private static normalizeChain(chain: string[]): string {
    if (chain.length <= 1) return chain.join('->');

    // Find the index of the lexicographically smallest variable (excluding the last duplicate)
    const chainWithoutDup = chain.slice(0, -1);
    const minIndex = chainWithoutDup.reduce(
      (minIdx, val, idx) => (val < chainWithoutDup[minIdx] ? idx : minIdx),
      0
    );

    // Rotate the chain to start with the smallest variable
    const rotated = [...chainWithoutDup.slice(minIndex), ...chainWithoutDup.slice(0, minIndex)];
    return rotated.join('->');
  }

  /**
   * Detect circular dependencies using DFS
   */
  private static detectCircularDependencies(
    depMap: Map<string, { variable: Variable; index: number; dependencies: string[] }>
  ): { chains: string[][]; variablesInCycles: Set<string> } {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const circularChains: string[][] = [];
    const variablesInCycles = new Set<string>();
    const seenChains = new Set<string>(); // Track normalized chains for deduplication

    const dfs = (varName: string, path: string[]): void => {
      visited.add(varName);
      recursionStack.add(varName);

      const varInfo = depMap.get(varName);
      if (varInfo) {
        for (const dep of varInfo.dependencies) {
          if (!depMap.has(dep)) {
            // Missing reference, skip
            continue;
          }

          if (recursionStack.has(dep)) {
            // Found a cycle - path doesn't include varName yet, so add it
            const cycleStart = path.indexOf(dep);

            // cycleStart will be -1 for self-references (dep not in path yet)
            // In this case, the cycle is just: varName -> dep (which is also varName)
            if (cycleStart >= 0) {
              // Normal cycle: extract path from where cycle starts
              const cycle = [...path.slice(cycleStart), varName, dep];

              // Normalize and check for duplicates
              const normalized = this.normalizeChain(cycle);
              if (!seenChains.has(normalized)) {
                seenChains.add(normalized);
                circularChains.push(cycle);
                // Mark all variables in the cycle (excluding the duplicate at the end)
                cycle.slice(0, -1).forEach((v) => variablesInCycles.add(v));
              }
            } else {
              // Self-reference: variable depends on itself
              const cycle = [varName, dep]; // Both are the same variable
              circularChains.push(cycle);
              variablesInCycles.add(varName);
            }
          } else if (!visited.has(dep)) {
            // Pass path with varName appended (functional style)
            dfs(dep, [...path, varName]);
          }
        }
      }

      recursionStack.delete(varName);
    };

    for (const varName of depMap.keys()) {
      if (!visited.has(varName)) {
        dfs(varName, []);
      }
    }

    return { chains: circularChains, variablesInCycles };
  }

  /**
   * Analyze dependencies for all variables
   */
  public static analyze(variables: Variable[]): DependencyAnalysisResult {
    const depMap = this.buildDependencyMap(variables);
    const { chains: circularChains, variablesInCycles } = this.detectCircularDependencies(depMap);
    const variableInfo = new Map<string, VariableDependencyInfo>();
    const allDependencies: VariableDependency[] = [];

    // Build reverse dependency map (who depends on me)
    const dependents = new Map<string, Set<string>>();
    for (const [varName, info] of depMap.entries()) {
      for (const dep of info.dependencies) {
        if (!dependents.has(dep)) {
          dependents.set(dep, new Set());
        }
        dependents.get(dep)!.add(varName);
      }
    }

    // Analyze each variable
    for (const [varName, info] of depMap.entries()) {
      const issues: DependencyIssue[] = [];
      const { dependencies, index } = info;

      // Check for self-reference
      if (dependencies.includes(varName)) {
        issues.push({
          type: DependencyIssueType.SelfReference,
          message: `Self reference: variable "${varName}" references itself`,
          relatedVariables: [varName],
        });
      }

      // Check for forward references (order violations) and build dependency list
      for (const dep of dependencies) {
        const depInfo = depMap.get(dep);
        if (!depInfo) {
          // Missing reference
          issues.push({
            type: DependencyIssueType.MissingReference,
            message: `Missing reference: variable "${varName}" references non-existent variable "${dep}"`,
            relatedVariables: [varName, dep],
          });
        } else {
          if (depInfo.index > index) {
            // Forward reference (depends on a variable that comes later)
            issues.push({
              type: DependencyIssueType.ForwardReference,
              message: `Order violation: variable "${varName}" references "${dep}" which comes after it in the list`,
              relatedVariables: [varName, dep],
            });
          }
          // Add to all dependencies
          allDependencies.push({ from: varName, to: dep });
        }
      }

      // Check if this variable is part of a circular dependency (O(1) lookup)
      if (variablesInCycles.has(varName)) {
        const circularChain = circularChains.find((chain) => chain.includes(varName));
        if (circularChain) {
          issues.push({
            type: DependencyIssueType.CircularDependency,
            message: `Circular dependency: variable "${varName}" is part of circular dependency: ${circularChain.join(
              ' -> '
            )}`,
            relatedVariables: circularChain,
          });
        }
      }

      variableInfo.set(varName, {
        name: varName,
        dependencies,
        dependents: Array.from(dependents.get(varName) || []),
        hasIssues: issues.length > 0,
        issues,
      });
    }

    return {
      variables: variableInfo,
      dependencies: allDependencies,
      circularChains,
    };
  }
}
