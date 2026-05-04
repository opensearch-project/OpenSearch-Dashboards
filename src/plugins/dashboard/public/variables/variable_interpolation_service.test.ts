/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  VariableInterpolationService,
  createNoOpVariableInterpolationService,
} from './variable_interpolation_service';
import { VariableType, VariableWithState, CustomVariable, VariableState } from './types';

type CustomVariableWithState = CustomVariable & VariableState;

const makeCustomVar = (overrides: Partial<CustomVariableWithState> = {}): VariableWithState => ({
  id: '1',
  name: 'service',
  type: VariableType.Custom,
  current: ['api'],
  customOptions: ['api', 'web', 'worker'],
  options: ['api', 'web', 'worker'],
  ...overrides,
});

const makeMultiVar = (overrides: Partial<CustomVariableWithState> = {}): VariableWithState => ({
  id: '2',
  name: 'region',
  type: VariableType.Custom,
  current: ['us-east', 'us-west'],
  multi: true,
  customOptions: ['us-east', 'us-west', 'eu-west'],
  options: ['us-east', 'us-west', 'eu-west'],
  ...overrides,
});

describe('VariableInterpolationService', () => {
  describe('hasVariables', () => {
    const svc = new VariableInterpolationService(() => []);

    it('should detect $var syntax', () => {
      expect(svc.hasVariables('source=logs | where service = $service')).toBe(true);
    });

    it('should detect ${var} syntax', () => {
      expect(svc.hasVariables('source=logs | where service = ${service}')).toBe(true);
    });

    it('should return false for no variables', () => {
      expect(svc.hasVariables('source=logs | where service = api')).toBe(false);
    });

    it('should return false for empty/null input', () => {
      expect(svc.hasVariables('')).toBe(false);
      expect(svc.hasVariables(null as any)).toBe(false);
      expect(svc.hasVariables(undefined as any)).toBe(false);
    });

    it('should not have stale lastIndex across sequential calls', () => {
      // Regression: static regex with g flag could cause alternating results
      expect(svc.hasVariables('$var')).toBe(true);
      expect(svc.hasVariables('$var')).toBe(true);
      expect(svc.hasVariables('$var')).toBe(true);
    });
  });

  describe('interpolate — single value', () => {
    it('should replace $var with current value', () => {
      const svc = new VariableInterpolationService(() => [makeCustomVar()]);
      expect(svc.interpolate('source=logs | where service = $service')).toBe(
        'source=logs | where service = api'
      );
    });

    it('should replace ${var} with current value', () => {
      const svc = new VariableInterpolationService(() => [makeCustomVar()]);
      expect(svc.interpolate('source=logs | where service = ${service}')).toBe(
        'source=logs | where service = api'
      );
    });

    it('should keep placeholder for unknown variables', () => {
      const svc = new VariableInterpolationService(() => []);
      expect(svc.interpolate('$unknown')).toBe('$unknown');
    });

    it('should replace multiple variables in one query', () => {
      const svc = new VariableInterpolationService(() => [
        makeCustomVar(),
        makeCustomVar({ id: '3', name: 'env', current: ['prod'] }),
      ]);
      expect(svc.interpolate('$service in $env')).toBe('api in prod');
    });

    it('should return empty string for variable with no current value', () => {
      const svc = new VariableInterpolationService(() => [makeCustomVar({ current: undefined })]);
      expect(svc.interpolate('$service')).toBe('');
    });
  });

  describe('interpolate — PPL escaping', () => {
    it('should escape single quotes in PPL', () => {
      const svc = new VariableInterpolationService(() => [makeCustomVar({ current: ["it's"] })]);
      expect(svc.interpolate("where name = '$service'", 'PPL')).toBe("where name = 'it''s'");
    });

    it('should escape backslashes in PPL', () => {
      const svc = new VariableInterpolationService(() => [
        makeCustomVar({ current: ['path\\to'] }),
      ]);
      expect(svc.interpolate('$service', 'PPL')).toBe('path\\\\to');
    });
  });

  describe('interpolate — PromQL escaping', () => {
    it('should escape regex metacharacters in PromQL', () => {
      const svc = new VariableInterpolationService(() => [
        makeCustomVar({ current: ['api.v2+test'] }),
      ]);
      expect(svc.interpolate('$service', 'PROMQL')).toBe('api\\.v2\\+test');
    });

    it('should escape pipe character in PromQL', () => {
      const svc = new VariableInterpolationService(() => [makeCustomVar({ current: ['a|b'] })]);
      expect(svc.interpolate('$service', 'PROMQL')).toBe('a\\|b');
    });
  });

  describe('interpolate — multi-select', () => {
    it('should format PPL multi-select as IN list', () => {
      const svc = new VariableInterpolationService(() => [makeMultiVar()]);
      expect(svc.interpolate('where region IN $region', 'PPL')).toBe(
        "where region IN ('us-east', 'us-west')"
      );
    });

    it('should format PromQL multi-select as regex alternation', () => {
      const svc = new VariableInterpolationService(() => [makeMultiVar()]);
      expect(svc.interpolate('{region=~"$region"}', 'PROMQL')).toBe(
        '{region=~"(us-east|us-west)"}'
      );
    });

    it('should format default multi-select as comma-separated', () => {
      const svc = new VariableInterpolationService(() => [makeMultiVar()]);
      expect(svc.interpolate('$region')).toBe('us-east, us-west');
    });

    it('should escape values in multi-select PPL', () => {
      const svc = new VariableInterpolationService(() => [
        makeMultiVar({ current: ["it's", "that's"] }),
      ]);
      expect(svc.interpolate('$region', 'PPL')).toBe("('it''s', 'that''s')");
    });

    it('should return empty PPL IN list when multi-select has no values', () => {
      const svc = new VariableInterpolationService(() => [makeMultiVar({ current: [] })]);
      expect(svc.interpolate('where region IN $region', 'PPL')).toBe("where region IN ('')");
    });

    it('should return empty PromQL group when multi-select has no values', () => {
      const svc = new VariableInterpolationService(() => [makeMultiVar({ current: [] })]);
      expect(svc.interpolate('{region=~"$region"}', 'PROMQL')).toBe('{region=~"()"}');
    });

    it('should return empty string for default when multi-select has no values', () => {
      const svc = new VariableInterpolationService(() => [makeMultiVar({ current: [] })]);
      expect(svc.interpolate('$region')).toBe('');
    });
  });

  describe('interpolate — optionType handling', () => {
    it('should format PPL multi-select number options without quotes', () => {
      const svc = new VariableInterpolationService(() => [
        makeMultiVar({ current: ['120', '223'], optionType: 'number' }),
      ]);
      expect(svc.interpolate('where id IN $region', 'PPL')).toBe('where id IN (120, 223)');
    });

    it('should format PPL multi-select boolean options without quotes', () => {
      const svc = new VariableInterpolationService(() => [
        makeMultiVar({ current: ['true', 'false'], optionType: 'boolean' }),
      ]);
      expect(svc.interpolate('where active IN $region', 'PPL')).toBe(
        'where active IN (true, false)'
      );
    });

    it('should format PPL multi-select string options with quotes', () => {
      const svc = new VariableInterpolationService(() => [
        makeMultiVar({ current: ['api', 'web'], optionType: 'string' }),
      ]);
      expect(svc.interpolate('where service IN $region', 'PPL')).toBe(
        "where service IN ('api', 'web')"
      );
    });

    it('should format PPL multi-select with quotes when optionType is undefined', () => {
      const svc = new VariableInterpolationService(() => [
        makeMultiVar({ current: ['api', 'web'], optionType: undefined }),
      ]);
      expect(svc.interpolate('where service IN $region', 'PPL')).toBe(
        "where service IN ('api', 'web')"
      );
    });

    it('should not affect PromQL formatting based on optionType', () => {
      const svc = new VariableInterpolationService(() => [
        makeMultiVar({ current: ['120', '223'], optionType: 'number' }),
      ]);
      expect(svc.interpolate('{id=~"$region"}', 'PROMQL')).toBe('{id=~"(120|223)"}');
    });

    it('should not affect default formatting based on optionType', () => {
      const svc = new VariableInterpolationService(() => [
        makeMultiVar({ current: ['120', '223'], optionType: 'number' }),
      ]);
      expect(svc.interpolate('$region')).toBe('120, 223');
    });
  });

  describe('getCurrentValues', () => {
    it('should return name-value map', () => {
      const svc = new VariableInterpolationService(() => [
        makeCustomVar(),
        makeCustomVar({ id: '3', name: 'env', current: ['prod'] }),
      ]);
      expect(svc.getCurrentValues()).toEqual({ service: 'api', env: 'prod' });
    });
  });

  describe('getVariables', () => {
    it('should convert Variable[] to VariableValue[]', () => {
      const svc = new VariableInterpolationService(() => [makeMultiVar()]);
      const vars = svc.getVariables();
      expect(vars).toEqual([
        {
          name: 'region',
          value: 'us-east,us-west',
          multi: true,
          values: ['us-east', 'us-west'],
        },
      ]);
    });

    it('should not split values for non-multi variables', () => {
      const svc = new VariableInterpolationService(() => [makeCustomVar()]);
      const vars = svc.getVariables();
      expect(vars[0].values).toBeUndefined();
    });
  });

  describe('createNoOpVariableInterpolationService', () => {
    const noop = createNoOpVariableInterpolationService();

    it('should return false for hasVariables', () => {
      expect(noop.hasVariables('$var')).toBe(false);
    });

    it('should return query unchanged for interpolate', () => {
      expect(noop.interpolate('$var')).toBe('$var');
    });

    it('should return empty values', () => {
      expect(noop.getCurrentValues()).toEqual({});
      expect(noop.getVariables()).toEqual([]);
    });
  });
});
