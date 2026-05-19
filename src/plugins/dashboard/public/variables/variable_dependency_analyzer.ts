/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Variable, VariableType } from './types';

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
  /** Whether any issues were detected */
  hasIssues: boolean;
  /** Circular dependency chains detected */
  circularChains: string[][];
}

/**
 * Analyzer for variable dependencies
 */
export class VariableDependencyAnalyzer {
  // Regex to match variable syntax: $variable or ${variable}
  private static readonly VARIABLE_PATTERN = /\$\{(\w+)\}|\$(\w+)/g;

  /**
   * Extract variable names referenced in a query string
   */
  private static extractVariableReferences(query: string): string[] {
    if (!query || typeof query !== 'string') {
      return [];
    }

    const references = new Set<string>();
    let match;
    // Reset lastIndex to ensure clean state
    const pattern = new RegExp(this.VARIABLE_PATTERN.source, this.VARIABLE_PATTERN.flags);

    while ((match = pattern.exec(query)) !== null) {
      const varName = match[1] || match[2];
      references.add(varName);
    }

    return Array.from(references);
  }

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
        dependencies = this.extractVariableReferences(variable.query);
      }

      map.set(variable.name, { variable, index, dependencies });
    });

    return map;
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

    const dfs = (varName: string, path: string[]): void => {
      visited.add(varName);
      recursionStack.add(varName);
      path.push(varName);

      const varInfo = depMap.get(varName);
      if (varInfo) {
        for (const dep of varInfo.dependencies) {
          if (!depMap.has(dep)) {
            // Missing reference, skip
            continue;
          }

          if (recursionStack.has(dep)) {
            // Found a cycle
            const cycleStart = path.indexOf(dep);
            const cycle = [...path.slice(cycleStart), dep];
            circularChains.push(cycle);
            // Mark all variables in the cycle
            cycle.forEach((v) => variablesInCycles.add(v));
          } else if (!visited.has(dep)) {
            dfs(dep, [...path]);
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
    let hasIssues = false;

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
              ' → '
            )}`,
            relatedVariables: circularChain,
          });
        }
      }

      const hasVariableIssues = issues.length > 0;
      if (hasVariableIssues) {
        hasIssues = true;
      }

      variableInfo.set(varName, {
        name: varName,
        dependencies,
        dependents: Array.from(dependents.get(varName) || []),
        hasIssues: hasVariableIssues,
        issues,
      });
    }

    return {
      variables: variableInfo,
      dependencies: allDependencies,
      hasIssues,
      circularChains,
    };
  }
}
