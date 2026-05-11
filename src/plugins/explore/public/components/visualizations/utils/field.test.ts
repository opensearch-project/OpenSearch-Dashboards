/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { normalizeField } from './field';

describe('normalizeField', () => {
  describe('basic functionality', () => {
    it('should return the same string for simple field names without special characters', () => {
      expect(normalizeField('fieldName')).toBe('fieldName');
      expect(normalizeField('field_name')).toBe('field_name');
      expect(normalizeField('field123')).toBe('field123');
      expect(normalizeField('@timestamp')).toBe('@timestamp');
    });

    it('should handle empty string', () => {
      expect(normalizeField('')).toBe('');
    });

    it('should trim whitespace', () => {
      expect(normalizeField(' fieldName ')).toBe('fieldName');
      expect(normalizeField('\tfieldName\n')).toBe('fieldName');
    });
  });

  describe('dot notation handling', () => {
    it('should replace single dot with underscore', () => {
      expect(normalizeField('machine.os')).toBe('machine_os');
    });

    it('should replace multiple dots with underscores', () => {
      expect(normalizeField('data.metrics.cpu')).toBe('data_metrics_cpu');
    });

    it('should handle dots at the beginning', () => {
      expect(normalizeField('.hidden')).toBe('_hidden');
    });

    it('should handle dots at the end', () => {
      expect(normalizeField('field.')).toBe('field_');
    });

    it('should handle consecutive dots', () => {
      expect(normalizeField('field..name')).toBe('field__name');
    });
  });

  describe('square bracket notation handling', () => {
    it('should replace opening square bracket with opening parenthesis', () => {
      expect(normalizeField('user[name')).toBe('user(name');
    });

    it('should replace closing square bracket with closing parenthesis', () => {
      expect(normalizeField('user]name')).toBe('user)name');
    });

    it('should replace both square brackets with parentheses', () => {
      expect(normalizeField('user[name]')).toBe('user(name)');
    });

    it('should handle array-like notation', () => {
      expect(normalizeField('items[0]')).toBe('items(0)');
      expect(normalizeField('data[items][0]')).toBe('data(items)(0)');
    });

    it('should handle nested bracket notation', () => {
      expect(normalizeField('data[user[name]]')).toBe('data(user(name))');
    });
  });

  describe('combined special characters', () => {
    it('should handle combination of dots and brackets', () => {
      expect(normalizeField('data.items[0]')).toBe('data_items(0)');
      expect(normalizeField('machine.os[version]')).toBe('machine_os(version)');
    });

    it('should handle complex nested field names', () => {
      expect(normalizeField('response.data.users[0].profile.name')).toBe(
        'response_data_users(0)_profile_name'
      );
    });

    it('should handle mixed notation patterns', () => {
      expect(normalizeField('obj.arr[0].nested[key].value')).toBe('obj_arr(0)_nested(key)_value');
    });
  });

  describe('edge cases', () => {
    it('should handle field names with only special characters', () => {
      expect(normalizeField('...')).toBe('___');
      expect(normalizeField('[]')).toBe('()');
      expect(normalizeField('.[][')).toBe('_()(');
    });

    it('should handle very long field names', () => {
      const longField =
        'very.long.nested.field.name.with.many.dots.and[brackets].everywhere[0][1][2]';
      const expected =
        'very_long_nested_field_name_with_many_dots_and(brackets)_everywhere(0)(1)(2)';
      expect(normalizeField(longField)).toBe(expected);
    });

    it('should handle field names with numbers and special characters', () => {
      expect(normalizeField('field123.data[0]')).toBe('field123_data(0)');
      expect(normalizeField('data[123].field')).toBe('data(123)_field');
    });

    it('should handle mixed brackets and dots with whitespace', () => {
      expect(normalizeField(' data.items[0].value ')).toBe('data_items(0)_value');
    });
  });

  describe('real-world examples', () => {
    it('should handle common OpenSearch field patterns', () => {
      expect(normalizeField('@timestamp')).toBe('@timestamp');
      expect(normalizeField('host.name')).toBe('host_name');
      expect(normalizeField('system.cpu.total.pct')).toBe('system_cpu_total_pct');
      expect(normalizeField('kubernetes.pod.name')).toBe('kubernetes_pod_name');
    });

    it('should handle log field patterns', () => {
      expect(normalizeField('log.level')).toBe('log_level');
      expect(normalizeField('error.message')).toBe('error_message');
      expect(normalizeField('http.request.method')).toBe('http_request_method');
    });

    it('should handle metric field patterns', () => {
      expect(normalizeField('metrics.cpu.usage')).toBe('metrics_cpu_usage');
      expect(normalizeField('system.memory.used.bytes')).toBe('system_memory_used_bytes');
    });

    it('should handle array-like field patterns', () => {
      expect(normalizeField('tags[0]')).toBe('tags(0)');
      expect(normalizeField('users[admin]')).toBe('users(admin)');
      expect(normalizeField('config[database][host]')).toBe('config(database)(host)');
    });

    it('should handle complex nested structures', () => {
      expect(normalizeField('response.data.items[0].attributes.name')).toBe(
        'response_data_items(0)_attributes_name'
      );
      expect(normalizeField('logs[2023-01-01].events[error].count')).toBe(
        'logs(2023-01-01)_events(error)_count'
      );
    });
  });

  describe('consistency and predictability', () => {
    it('should be idempotent for already normalized fields', () => {
      const alreadyNormalized = 'field_name';
      expect(normalizeField(alreadyNormalized)).toBe(alreadyNormalized);
    });

    it('should handle repeated normalization consistently', () => {
      const original = 'data.items[0].value';
      const firstNormalization = normalizeField(original);
      const secondNormalization = normalizeField(firstNormalization);
      expect(firstNormalization).toBe(secondNormalization);
    });
  });
});
