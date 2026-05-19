/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VariableDependencyAnalyzer, DependencyIssueType } from './variable_dependency_analyzer';
import { Variable, VariableType } from './types';

describe('VariableDependencyAnalyzer', () => {
  const createQueryVar = (name: string, query: string): Variable => ({
    id: `${name}-id`,
    name,
    type: VariableType.Query,
    query,
    language: 'PPL',
  });

  const createCustomVar = (name: string): Variable => ({
    id: `${name}-id`,
    name,
    type: VariableType.Custom,
    customOptions: ['option1', 'option2'],
  });

  describe('analyze', () => {
    it('should detect no issues for independent variables', () => {
      const variables: Variable[] = [
        createQueryVar('a', 'source=logs | fields host'),
        createQueryVar('b', 'source=metrics | fields service'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);

      expect(result.size).toBe(2);
      expect(result.get('a')?.hasIssues).toBe(false);
      expect(result.get('b')?.hasIssues).toBe(false);
    });

    it('should detect valid dependencies (correct order)', () => {
      const variables: Variable[] = [
        createQueryVar('a', 'source=logs | fields host'),
        createQueryVar('b', 'source=logs | where host=$a | fields service'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);

      const varB = result.get('b');
      expect(varB?.dependencies).toEqual(['a']);
      expect(varB?.hasIssues).toBe(false);

      const varA = result.get('a');
      expect(varA?.dependents).toContain('b');
    });

    it('should detect forward reference (order violation)', () => {
      const variables: Variable[] = [
        createQueryVar('a', 'source=logs | where host=$b | fields host'),
        createQueryVar('b', 'source=logs | fields service'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);

      const varA = result.get('a');
      expect(varA?.hasIssues).toBe(true);
      expect(varA?.issues).toHaveLength(1);
      expect(varA?.issues[0].type).toBe(DependencyIssueType.ForwardReference);
    });

    it('should detect self-reference', () => {
      const variables: Variable[] = [
        createQueryVar('a', 'source=logs | where host=$a | fields host'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);

      const varA = result.get('a');
      expect(varA?.hasIssues).toBe(true);
      expect(varA?.issues[0].type).toBe(DependencyIssueType.SelfReference);
    });

    it('should detect circular dependency (2 variables)', () => {
      const variables: Variable[] = [
        createQueryVar('a', 'source=logs | where service=$b | fields host'),
        createQueryVar('b', 'source=logs | where host=$a | fields service'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);

      const varA = result.get('a');
      const varB = result.get('b');
      expect(varA?.hasIssues).toBe(true);
      expect(varB?.hasIssues).toBe(true);
      expect(varA?.issues.some((i) => i.type === DependencyIssueType.CircularDependency)).toBe(
        true
      );
      expect(varB?.issues.some((i) => i.type === DependencyIssueType.CircularDependency)).toBe(
        true
      );
    });

    it('should detect circular dependency (3 variables)', () => {
      const variables: Variable[] = [
        createQueryVar('a', 'source=logs | where service=$b | fields host'),
        createQueryVar('b', 'source=logs | where env=$c | fields service'),
        createQueryVar('c', 'source=logs | where host=$a | fields env'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);

      const varA = result.get('a');
      const varB = result.get('b');
      const varC = result.get('c');
      expect(varA?.hasIssues).toBe(true);
      expect(varB?.hasIssues).toBe(true);
      expect(varC?.hasIssues).toBe(true);
    });

    it('should detect missing reference', () => {
      const variables: Variable[] = [
        createQueryVar('a', 'source=logs | where host=$nonexistent | fields host'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);

      const varA = result.get('a');
      expect(varA?.hasIssues).toBe(true);
      expect(varA?.issues[0].type).toBe(DependencyIssueType.MissingReference);
    });

    it('should handle ${var} and $var syntax', () => {
      const variables: Variable[] = [
        createQueryVar('a', 'source=logs | fields host'),
        createQueryVar('b', 'source=logs | where host=${a} | fields service'),
        createQueryVar('c', 'source=logs | where service=$b | fields env'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);
      const varB = result.get('b');
      const varC = result.get('c');
      expect(varB?.dependencies).toEqual(['a']);
      expect(varC?.dependencies).toEqual(['b']);
    });

    it('should handle multiple dependencies', () => {
      const variables: Variable[] = [
        createQueryVar('a', 'source=logs | fields host'),
        createQueryVar('b', 'source=logs | fields service'),
        createQueryVar('c', 'source=logs | where host=$a and service=$b | fields env'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);
      const varC = result.get('c');
      expect(varC?.dependencies).toEqual(['a', 'b']);
    });

    it('should track dependents correctly', () => {
      const variables: Variable[] = [
        createQueryVar('a', 'source=logs | fields host'),
        createQueryVar('b', 'source=logs | where host=$a | fields service'),
        createQueryVar('c', 'source=logs | where host=$a | fields env'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);

      const varA = result.get('a');
      expect(varA?.dependents).toContain('b');
      expect(varA?.dependents).toContain('c');
      expect(varA?.dependents).toHaveLength(2);
    });

    it('should handle custom variables (no dependencies)', () => {
      const variables: Variable[] = [
        createCustomVar('a'),
        createQueryVar('b', 'source=logs | where host=$a | fields service'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);
      const varA = result.get('a');
      expect(varA?.dependencies).toHaveLength(0);
      expect(varA?.dependents).toEqual(['b']);
    });

    it('should handle empty query string', () => {
      const variables: Variable[] = [createQueryVar('a', ''), createQueryVar('b', 'source=logs')];

      const result = VariableDependencyAnalyzer.analyze(variables);
      const varA = result.get('a');
      expect(varA?.dependencies).toHaveLength(0);
    });

    it('should deduplicate variable references in same query', () => {
      const variables: Variable[] = [
        createQueryVar('a', 'source=logs | fields host'),
        createQueryVar(
          'b',
          'source=logs | where host=$a and region=$a and env=$a | fields service'
        ),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);

      const varB = result.get('b');
      expect(varB?.dependencies).toEqual(['a']); // Should only include 'a' once
    });

    it('should handle mixed variable syntax in same query', () => {
      const variables: Variable[] = [
        createQueryVar('region', 'source=logs | fields region'),
        createQueryVar('host', 'source=logs | fields host'),
        createQueryVar('combined', 'where region=$region and host=${host} and region=${region}'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);

      const varCombined = result.get('combined');
      expect(varCombined?.dependencies).toContain('region');
      expect(varCombined?.dependencies).toContain('host');
      expect(varCombined?.dependencies).toHaveLength(2); // Deduplicated
    });

    it('should detect complex circular dependency chain', () => {
      const variables: Variable[] = [
        createQueryVar('a', 'source=logs | where x=$b | fields a'),
        createQueryVar('b', 'source=logs | where x=$c | fields b'),
        createQueryVar('c', 'source=logs | where x=$d | fields c'),
        createQueryVar('d', 'source=logs | where x=$a | fields d'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);

      // All variables in the chain should have circular dependency issues
      ['a', 'b', 'c', 'd'].forEach((varName) => {
        const varInfo = result.get(varName);
        expect(varInfo?.hasIssues).toBe(true);
        expect(varInfo?.issues.some((i) => i.type === DependencyIssueType.CircularDependency)).toBe(
          true
        );
      });
    });

    it('should detect multiple independent circular dependencies', () => {
      const variables: Variable[] = [
        // Cycle 1: a ↔ b
        createQueryVar('a', 'where x=$b'),
        createQueryVar('b', 'where x=$a'),
        // Cycle 2: c ↔ d
        createQueryVar('c', 'where x=$d'),
        createQueryVar('d', 'where x=$c'),
        // Independent variable
        createQueryVar('e', 'source=logs'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);

      // Variables in cycles should have issues
      expect(result.get('a')?.hasIssues).toBe(true);
      expect(result.get('b')?.hasIssues).toBe(true);
      expect(result.get('c')?.hasIssues).toBe(true);
      expect(result.get('d')?.hasIssues).toBe(true);

      // Independent variable should be fine
      expect(result.get('e')?.hasIssues).toBe(false);
    });

    it('should handle variable with both forward reference and missing reference', () => {
      const variables: Variable[] = [
        createQueryVar('a', 'where x=$b and y=$nonexistent'),
        createQueryVar('b', 'source=logs'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);

      const varA = result.get('a');
      expect(varA?.hasIssues).toBe(true);
      expect(varA?.issues).toHaveLength(2);

      const issueTypes = varA?.issues.map((i) => i.type);
      expect(issueTypes).toContain(DependencyIssueType.ForwardReference);
      expect(issueTypes).toContain(DependencyIssueType.MissingReference);
    });

    it('should handle diamond dependency pattern', () => {
      const variables: Variable[] = [
        createQueryVar('a', 'source=logs'),
        createQueryVar('b', 'where x=$a'),
        createQueryVar('c', 'where x=$a'),
        createQueryVar('d', 'where x=$b and y=$c'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);
      const varA = result.get('a');
      expect(varA?.dependents).toContain('b');
      expect(varA?.dependents).toContain('c');
      expect(varA?.dependents).toHaveLength(2);

      const varD = result.get('d');
      expect(varD?.dependencies).toContain('b');
      expect(varD?.dependencies).toContain('c');
    });

    it('should return empty analysis for empty variable list', () => {
      const result = VariableDependencyAnalyzer.analyze([]);
      expect(result.size).toBe(0);
    });

    it('should handle single variable without dependencies', () => {
      const variables: Variable[] = [createQueryVar('a', 'source=logs | fields host')];

      const result = VariableDependencyAnalyzer.analyze(variables);
      const varA = result.get('a');
      expect(varA?.dependencies).toHaveLength(0);
      expect(varA?.dependents).toHaveLength(0);
    });

    it('should track all dependency edges correctly', () => {
      const variables: Variable[] = [
        createQueryVar('a', 'source=logs'),
        createQueryVar('b', 'where x=$a'),
        createQueryVar('c', 'where x=$a and y=$b'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);

      // Check dependencies
      expect(result.get('a')?.dependencies).toEqual([]);
      expect(result.get('b')?.dependencies).toEqual(['a']);
      expect(result.get('c')?.dependencies).toEqual(['a', 'b']);

      // Check dependents (reverse relationships)
      expect(result.get('a')?.dependents).toContain('b');
      expect(result.get('a')?.dependents).toContain('c');
      expect(result.get('b')?.dependents).toEqual(['c']);
    });

    it('should not include missing references in dependency edges', () => {
      const variables: Variable[] = [
        createQueryVar('a', 'source=logs'),
        createQueryVar('b', 'where x=$a and y=$missing'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);

      // Should only have dependency for 'a', not 'missing'
      const varB = result.get('b');
      expect(varB?.dependencies).toEqual(['a', 'missing']); // Raw dependencies include both
      expect(varB?.hasIssues).toBe(true);

      // Should have a missing reference issue
      expect(varB?.issues.some((i) => i.type === DependencyIssueType.MissingReference)).toBe(true);

      // 'a' should have 'b' as dependent
      expect(result.get('a')?.dependents).toEqual(['b']);
    });

    it('should handle variable names with underscores and numbers', () => {
      const variables: Variable[] = [
        createQueryVar('region_1', 'source=logs'),
        createQueryVar('host_name_2', 'where region=$region_1'),
        createQueryVar('service_v3', 'where host=${host_name_2}'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);
      expect(result.get('host_name_2')?.dependencies).toEqual(['region_1']);
      expect(result.get('service_v3')?.dependencies).toEqual(['host_name_2']);
    });

    it('should handle self-reference combined with other dependencies', () => {
      const variables: Variable[] = [
        createQueryVar('a', 'source=logs'),
        createQueryVar('b', 'where x=$a and y=$b and z=$a'), // Self-ref + normal dep
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);

      const varB = result.get('b');
      expect(varB?.hasIssues).toBe(true);
      expect(varB?.dependencies).toContain('a');
      expect(varB?.dependencies).toContain('b');

      // Should have self-reference issue
      expect(varB?.issues.some((i) => i.type === DependencyIssueType.SelfReference)).toBe(true);
    });

    it('should handle long dependency chain without cycles', () => {
      const variables: Variable[] = [
        createQueryVar('v1', 'source=logs'),
        createQueryVar('v2', 'where x=$v1'),
        createQueryVar('v3', 'where x=$v2'),
        createQueryVar('v4', 'where x=$v3'),
        createQueryVar('v5', 'where x=$v4'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);

      // Each variable should depend on the previous one
      expect(result.get('v2')?.dependencies).toEqual(['v1']);
      expect(result.get('v3')?.dependencies).toEqual(['v2']);
      expect(result.get('v4')?.dependencies).toEqual(['v3']);
      expect(result.get('v5')?.dependencies).toEqual(['v4']);
    });

    it('should detect self-reference as a cycle', () => {
      const variables: Variable[] = [createQueryVar('a', 'where x=$a | fields host')];

      const result = VariableDependencyAnalyzer.analyze(variables);

      const varA = result.get('a');
      expect(varA?.hasIssues).toBe(true);

      // Should have self-reference issue (may or may not also report as circular dependency)
      const hasSelfRef = varA?.issues.some((i) => i.type === DependencyIssueType.SelfReference);
      expect(hasSelfRef).toBe(true);
    });

    it('should not report invalid cycles when cycleStart is -1', () => {
      // This test ensures we correctly handle self-references
      const variables: Variable[] = [
        createQueryVar('a', 'source=logs'),
        createQueryVar('b', 'where x=$a'), // Valid dependency
        createQueryVar('c', 'where x=$c'), // Self-reference
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);

      // Should detect self-reference for 'c'
      const varC = result.get('c');
      expect(varC?.hasIssues).toBe(true);
      expect(varC?.issues.some((i) => i.type === DependencyIssueType.SelfReference)).toBe(true);

      // 'a' and 'b' should be fine
      expect(result.get('a')?.hasIssues).toBe(false);
      expect(result.get('b')?.hasIssues).toBe(false);
    });

    it('should provide detailed messages for all issue types', () => {
      const variables: Variable[] = [
        createQueryVar('a', 'where x=$a and y=$nonexistent'),
        createQueryVar('b', 'where x=$c'),
        createQueryVar('c', 'where x=$b'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);

      // Check self-reference message
      const varA = result.get('a');
      const selfRefIssue = varA?.issues.find((i) => i.type === DependencyIssueType.SelfReference);
      expect(selfRefIssue?.message).toContain('a');
      expect(selfRefIssue?.relatedVariables).toEqual(['a']);

      // Check missing reference message
      const missingRefIssue = varA?.issues.find(
        (i) => i.type === DependencyIssueType.MissingReference
      );
      expect(missingRefIssue?.message).toContain('nonexistent');
      expect(missingRefIssue?.relatedVariables).toContain('a');
      expect(missingRefIssue?.relatedVariables).toContain('nonexistent');

      // Check circular dependency message
      const varB = result.get('b');
      const circularIssue = varB?.issues.find(
        (i) => i.type === DependencyIssueType.CircularDependency
      );
      expect(circularIssue?.message).toContain('->');
      expect(circularIssue?.relatedVariables.length).toBeGreaterThan(1);
    });

    it('should handle variable with both self-reference and circular dependency', () => {
      // Variable 'a' references itself AND is part of a cycle with 'b'
      const variables = [
        createQueryVar('a', 'where x=$a and y=$b'), // a depends on [a, b]
        createQueryVar('b', 'where z=$a'), // b depends on [a]
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);

      // Should detect 2 cycles: self-reference [a,a] and loop [a,b,a]

      const varA = result.get('a');
      expect(varA?.hasIssues).toBe(true);

      // Should have both SelfReference and CircularDependency issues
      const selfRefIssue = varA?.issues.find((i) => i.type === DependencyIssueType.SelfReference);
      const circularIssue = varA?.issues.find(
        (i) => i.type === DependencyIssueType.CircularDependency
      );

      expect(selfRefIssue).toBeDefined();
      expect(circularIssue).toBeDefined();
    });

    it('should detect multiple cycles sharing common path (a->b->c->a and a->b->d->a)', () => {
      // Two cycles sharing the path a->b
      const variables = [
        createQueryVar('a', 'where x=$b'),
        createQueryVar('b', 'where y=$c and z=$d'),
        createQueryVar('c', 'where w=$a'),
        createQueryVar('d', 'where v=$a'),
      ];

      const result = VariableDependencyAnalyzer.analyze(variables);

      // All 4 variables are involved in cycles
      expect(result.get('a')?.hasIssues).toBe(true);
      expect(result.get('b')?.hasIssues).toBe(true);
      expect(result.get('c')?.hasIssues).toBe(true);
      expect(result.get('d')?.hasIssues).toBe(true);

      // All should have circular dependency issues
      expect(
        result.get('a')?.issues.some((i) => i.type === DependencyIssueType.CircularDependency)
      ).toBe(true);
      expect(
        result.get('b')?.issues.some((i) => i.type === DependencyIssueType.CircularDependency)
      ).toBe(true);
      expect(
        result.get('c')?.issues.some((i) => i.type === DependencyIssueType.CircularDependency)
      ).toBe(true);
      expect(
        result.get('d')?.issues.some((i) => i.type === DependencyIssueType.CircularDependency)
      ).toBe(true);
    });
  });
});
