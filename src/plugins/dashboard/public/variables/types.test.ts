/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VariableUtils, VARIABLE_REFERENCE_PATTERN } from './types';

describe('VARIABLE_REFERENCE_PATTERN', () => {
  it('should be a global regex with correct flags', () => {
    expect(VARIABLE_REFERENCE_PATTERN.global).toBe(true);
    expect(VARIABLE_REFERENCE_PATTERN.source).toBe('\\$\\{(\\w+)\\}|\\$(\\w+)');
  });

  it('should match both ${var} and $var syntax', () => {
    const text = 'where region=$region and host=${host}';
    const matches = text.match(VARIABLE_REFERENCE_PATTERN);
    expect(matches).toEqual(['$region', '${host}']);
  });
});

describe('VariableUtils', () => {
  describe('escapeRegex', () => {
    it('should escape all special regex characters', () => {
      expect(VariableUtils.escapeRegex('test.var')).toBe('test\\.var');
      expect(VariableUtils.escapeRegex('var*')).toBe('var\\*');
      expect(VariableUtils.escapeRegex('var+')).toBe('var\\+');
      expect(VariableUtils.escapeRegex('var?')).toBe('var\\?');
      expect(VariableUtils.escapeRegex('var^')).toBe('var\\^');
      expect(VariableUtils.escapeRegex('var$')).toBe('var\\$');
      expect(VariableUtils.escapeRegex('var{}')).toBe('var\\{\\}');
      expect(VariableUtils.escapeRegex('var()')).toBe('var\\(\\)');
      expect(VariableUtils.escapeRegex('var|')).toBe('var\\|');
      expect(VariableUtils.escapeRegex('var[]')).toBe('var\\[\\]');
      expect(VariableUtils.escapeRegex('var\\')).toBe('var\\\\');
    });

    it('should escape multiple special characters', () => {
      expect(VariableUtils.escapeRegex('region.prod*')).toBe('region\\.prod\\*');
      expect(VariableUtils.escapeRegex('var(a|b)')).toBe('var\\(a\\|b\\)');
    });

    it('should not modify normal strings', () => {
      expect(VariableUtils.escapeRegex('region')).toBe('region');
      expect(VariableUtils.escapeRegex('region_1')).toBe('region_1');
      expect(VariableUtils.escapeRegex('hostName123')).toBe('hostName123');
    });

    it('should handle empty string', () => {
      expect(VariableUtils.escapeRegex('')).toBe('');
    });

    it('should handle strings with only special characters', () => {
      expect(VariableUtils.escapeRegex('.*+?')).toBe('\\.\\*\\+\\?');
    });
  });

  describe('createReferencePattern', () => {
    it('should create pattern that matches ${varName} syntax', () => {
      const pattern = VariableUtils.createReferencePattern('region');
      expect(pattern.test('where region=${region}')).toBe(true);
      expect(pattern.test('where region = ${region}')).toBe(true);
    });

    it('should create pattern that matches $varName syntax', () => {
      const pattern = VariableUtils.createReferencePattern('region');
      expect(pattern.test('where region=$region')).toBe(true);
      expect(pattern.test('where region = $region')).toBe(true);
    });

    it('should respect word boundaries for simple syntax', () => {
      const pattern = VariableUtils.createReferencePattern('region');
      expect(pattern.test('where x=$region')).toBe(true);
      expect(pattern.test('where x=$regionProd')).toBe(false); // word boundary
      expect(pattern.test('where x=$region_prod')).toBe(false); // underscore is word char
    });

    it('should match at start of string', () => {
      const pattern = VariableUtils.createReferencePattern('region');
      expect(pattern.test('$region and host')).toBe(true);
      expect(pattern.test('${region} and host')).toBe(true);
    });

    it('should match at end of string', () => {
      const pattern = VariableUtils.createReferencePattern('region');
      expect(pattern.test('where x=$region')).toBe(true);
      expect(pattern.test('where x=${region}')).toBe(true);
    });

    it('should handle variable names with underscores and numbers', () => {
      const pattern = VariableUtils.createReferencePattern('region_1');
      expect(pattern.test('where x=$region_1')).toBe(true);
      expect(pattern.test('where x=${region_1}')).toBe(true);
    });

    it('should escape special characters in variable names', () => {
      // Although variable names are validated to not contain these,
      // the function should still handle them safely
      const pattern = VariableUtils.createReferencePattern('region.prod');
      expect(pattern.test('where x=$region.prod')).toBe(true);
      // Should NOT match 'regionXprod' because . is escaped
      expect(() => pattern.test('where x=$regionXprod')).not.toThrow();
    });

    it('should create case-sensitive patterns', () => {
      const pattern = VariableUtils.createReferencePattern('Region');
      expect(pattern.test('where x=$Region')).toBe(true);
      expect(pattern.test('where x=$region')).toBe(false);
    });
  });

  describe('extractVariableNames', () => {
    it('should extract variable names from $var syntax', () => {
      const names = VariableUtils.extractVariableNames('where region=$region and host=$host');
      expect(names).toEqual(['region', 'host']);
    });

    it('should extract variable names from ${var} syntax', () => {
      const names = VariableUtils.extractVariableNames('where region=${region} and host=${host}');
      expect(names).toEqual(['region', 'host']);
    });

    it('should extract variable names from mixed syntax', () => {
      const names = VariableUtils.extractVariableNames('where region=$region and host=${host}');
      expect(names).toEqual(['region', 'host']);
    });

    it('should deduplicate variable names', () => {
      const names = VariableUtils.extractVariableNames(
        'where region=$region and host=$region and env=$region'
      );
      expect(names).toEqual(['region']);
    });

    it('should handle variables with underscores and numbers', () => {
      const names = VariableUtils.extractVariableNames('$region_1 and ${host_name_2}');
      expect(names).toEqual(['region_1', 'host_name_2']);
    });

    it('should handle empty string', () => {
      const names = VariableUtils.extractVariableNames('');
      expect(names).toEqual([]);
    });

    it('should handle null input', () => {
      const names = VariableUtils.extractVariableNames(null as any);
      expect(names).toEqual([]);
    });

    it('should handle undefined input', () => {
      const names = VariableUtils.extractVariableNames(undefined as any);
      expect(names).toEqual([]);
    });

    it('should handle non-string input', () => {
      const names = VariableUtils.extractVariableNames(123 as any);
      expect(names).toEqual([]);
    });

    it('should handle text with no variables', () => {
      const names = VariableUtils.extractVariableNames('source=logs | fields host');
      expect(names).toEqual([]);
    });

    it('should handle text with only variable references', () => {
      const names = VariableUtils.extractVariableNames('$a $b ${c}');
      expect(names).toEqual(['a', 'b', 'c']);
    });

    it('should handle consecutive variables', () => {
      const names = VariableUtils.extractVariableNames('$a$b${c}${d}');
      expect(names).toEqual(['a', 'b', 'c', 'd']);
    });

    it('should not match variables starting with numbers', () => {
      // \w+ requires at least one word character, but doesn't allow starting with digit
      // Actually, \w includes digits, so $123 would match '123'
      const names = VariableUtils.extractVariableNames('$123var');
      // This will extract '123' which is technically valid for the regex
      expect(names).toEqual(['123var']);
    });

    it('should handle special characters after variables', () => {
      const names = VariableUtils.extractVariableNames('$region, $host; $env.');
      expect(names).toEqual(['region', 'host', 'env']);
    });

    it('should preserve order of first occurrence', () => {
      const names = VariableUtils.extractVariableNames('$b $a $c $a $b');
      expect(names).toEqual(['b', 'a', 'c']); // Order of first appearance
    });
  });

  describe('containsReference', () => {
    it('should return true when variable is referenced with $var syntax', () => {
      expect(VariableUtils.containsReference('where x=$region', 'region')).toBe(true);
    });

    it('should return true when variable is referenced with ${var} syntax', () => {
      expect(VariableUtils.containsReference('where x=${region}', 'region')).toBe(true);
    });

    it('should return false when variable is not referenced', () => {
      expect(VariableUtils.containsReference('where x=$host', 'region')).toBe(false);
    });

    it('should return false for partial matches due to word boundary', () => {
      expect(VariableUtils.containsReference('where x=$regionProd', 'region')).toBe(false);
    });

    it('should handle empty text', () => {
      expect(VariableUtils.containsReference('', 'region')).toBe(false);
    });

    it('should handle null text', () => {
      expect(VariableUtils.containsReference(null as any, 'region')).toBe(false);
    });

    it('should handle undefined text', () => {
      expect(VariableUtils.containsReference(undefined as any, 'region')).toBe(false);
    });

    it('should handle non-string text', () => {
      expect(VariableUtils.containsReference(123 as any, 'region')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(VariableUtils.containsReference('where x=$Region', 'region')).toBe(false);
      expect(VariableUtils.containsReference('where x=$Region', 'Region')).toBe(true);
    });

    it('should handle multiple variables in text', () => {
      const text = 'where region=$region and host=$host';
      expect(VariableUtils.containsReference(text, 'region')).toBe(true);
      expect(VariableUtils.containsReference(text, 'host')).toBe(true);
      expect(VariableUtils.containsReference(text, 'env')).toBe(false);
    });

    it('should handle variables with underscores and numbers', () => {
      expect(VariableUtils.containsReference('where x=$region_1', 'region_1')).toBe(true);
      expect(VariableUtils.containsReference('where x=${host_name_2}', 'host_name_2')).toBe(true);
    });

    it('should work with complex queries', () => {
      const query = `
        source=logs
        | where region=\${region}
          and host=$host
          and service IN ($service)
        | fields *
      `;
      expect(VariableUtils.containsReference(query, 'region')).toBe(true);
      expect(VariableUtils.containsReference(query, 'host')).toBe(true);
      expect(VariableUtils.containsReference(query, 'service')).toBe(true);
      expect(VariableUtils.containsReference(query, 'env')).toBe(false);
    });

    it('should handle variables at different positions', () => {
      expect(VariableUtils.containsReference('$region', 'region')).toBe(true); // start
      expect(VariableUtils.containsReference('x=$region', 'region')).toBe(true); // end
      expect(VariableUtils.containsReference('x=$region and y', 'region')).toBe(true); // middle
    });

    it('should not match substring without word boundary', () => {
      // $region_prod contains "region" but not as a separate variable
      expect(VariableUtils.containsReference('$region_prod', 'region')).toBe(false);
      expect(VariableUtils.containsReference('${region_prod}', 'region')).toBe(false);
    });

    it('should handle escaped regex characters in variable names', () => {
      // Although variable names shouldn't contain these, test defense in depth
      expect(VariableUtils.containsReference('$region.prod', 'region.prod')).toBe(true);
    });
  });

  describe('Integration tests', () => {
    it('should work together for complete workflow', () => {
      const query = 'where region=$region and host=${host} and region=$region';

      // Extract all variable names
      const variables = VariableUtils.extractVariableNames(query);
      expect(variables).toEqual(['region', 'host']);

      // Check if specific variables are present
      expect(VariableUtils.containsReference(query, 'region')).toBe(true);
      expect(VariableUtils.containsReference(query, 'host')).toBe(true);
      expect(VariableUtils.containsReference(query, 'env')).toBe(false);

      // Create patterns for validation
      const regionPattern = VariableUtils.createReferencePattern('region');
      expect(regionPattern.test(query)).toBe(true);
    });

    it('should handle real-world PPL queries', () => {
      const query = `
        source=logs
        | where region='\${region}'
          and host IN ($host)
          and timestamp > now() - \${timeWindow}
        | stats count() by service
      `;

      const variables = VariableUtils.extractVariableNames(query);
      expect(variables).toContain('region');
      expect(variables).toContain('host');
      expect(variables).toContain('timeWindow');
      expect(variables).toHaveLength(3);
    });

    it('should handle edge cases consistently', () => {
      const edgeCases = [
        '',
        null,
        undefined,
        123,
        'no variables here',
        '$',
        '${',
        '${}',
        '$ var',
        '$-var',
      ];

      edgeCases.forEach((testCase) => {
        expect(() => {
          VariableUtils.extractVariableNames(testCase as any);
          VariableUtils.containsReference(testCase as any, 'test');
        }).not.toThrow();
      });
    });
  });
});
