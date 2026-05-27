/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Variable, VariableType } from './types';
import { VariableUtils } from './utils';

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
   * Detect circular dependencies using Depth-First Search (DFS)
   */
  private static detectCircularDependencies(
    depMap: Map<string, { variable: Variable; index: number; dependencies: string[] }>
  ): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const circularChains: string[][] = [];

    const dfs = (varName: string, path: string[]): void => {
      visited.add(varName);
      recursionStack.add(varName);
      path.push(varName);
      const varInfo = depMap.get(varName);
      if (varInfo) {
        // Check each dependency of this variable
        for (const dep of varInfo.dependencies) {
          // Skip if dependency doesn't exist (will be reported separately)
          if (!depMap.has(dep)) {
            continue;
          }

          // Case 1: Dependency is in recursion stack → Cycle detected!
          if (recursionStack.has(dep) && dep !== varName) {
            const cycleStart = path.indexOf(dep);
            const cycle = [...path.slice(cycleStart), dep];
            circularChains.push(cycle);
          }
          // Case 2: Dependency not visited yet → Continue DFS
          else if (!visited.has(dep)) {
            dfs(dep, path);
          }
        }
      }

      path.pop();
      recursionStack.delete(varName);
    };

    for (const varName of depMap.keys()) {
      if (!visited.has(varName)) {
        dfs(varName, []);
      }
    }

    return circularChains;
  }

  /**
   * Analyze dependencies for all variables
   */
  public static analyze(variables: Variable[]): Map<string, VariableDependencyInfo> {
    // Step 1: Build dependency map (variable name → {variable, index, dependencies})
    const depMap = this.buildDependencyMap(variables);

    // Step 2: Detect all circular dependencies
    const circularChains = this.detectCircularDependencies(depMap);

    const variableInfo = new Map<string, VariableDependencyInfo>();

    // Step 3: Build reverse dependency map (who depends on me)
    const dependents = new Map<string, Set<string>>();
    for (const [varName, info] of depMap.entries()) {
      for (const dep of info.dependencies) {
        if (!dependents.has(dep)) {
          dependents.set(dep, new Set());
        }
        dependents.get(dep)!.add(varName);
      }
    }

    // Step 4: Analyze each variable for issues
    for (const [varName, info] of depMap.entries()) {
      const issues: DependencyIssue[] = [];
      const { dependencies, index } = info;

      // Issue 1: Self-reference (variable references itself)
      if (dependencies.includes(varName)) {
        issues.push({
          type: DependencyIssueType.SelfReference,
          message: `Self reference: variable "${varName}" references itself`,
          relatedVariables: [varName],
        });
      }

      // Issue 2 & 3: Check each dependency
      for (const dep of dependencies) {
        const depInfo = depMap.get(dep);

        if (!depInfo) {
          // Issue 2: Missing reference (dependency doesn't exist)
          issues.push({
            type: DependencyIssueType.MissingReference,
            message: `Missing reference: variable "${varName}" references non-existent variable "${dep}"`,
            relatedVariables: [varName, dep],
          });
        } else {
          // Issue 3: Forward reference (dependency comes after in the list)
          if (depInfo.index > index) {
            issues.push({
              type: DependencyIssueType.ForwardReference,
              message: `Order violation: variable "${varName}" references "${dep}" which comes after it in the list`,
              relatedVariables: [varName, dep],
            });
          }
        }
      }

      // Issue 4: Circular dependency (variable is part of a cycle)
      circularChains.forEach((chain) => {
        if (chain.includes(varName)) {
          issues.push({
            type: DependencyIssueType.CircularDependency,
            message: `Circular dependency: variable "${varName}" is part of circular dependency: ${chain.join(
              ' -> '
            )}`,
            relatedVariables: chain,
          });
        }
      });

      // Store analysis result for this variable
      variableInfo.set(varName, {
        name: varName,
        dependencies,
        dependents: Array.from(dependents.get(varName) || []),
        hasIssues: issues.length > 0,
        issues,
      });
    }

    return variableInfo;
  }
}
