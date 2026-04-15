/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { setActiveVariables, getActiveVariables } from './active_variables';
import { Variable, VariableType } from './types';

describe('activeVariables', () => {
  afterEach(() => {
    setActiveVariables(undefined);
  });

  it('should return undefined by default', () => {
    expect(getActiveVariables()).toBeUndefined();
  });

  it('should store and retrieve variables', () => {
    const vars: Variable[] = [
      {
        id: '1',
        name: 'env',
        type: VariableType.Custom,
        current: ['dev'],
        customOptions: ['dev', 'prod'],
      },
    ];
    setActiveVariables(vars);
    expect(getActiveVariables()).toBe(vars);
  });

  it('should clear variables when set to undefined', () => {
    setActiveVariables([
      {
        id: '1',
        name: 'env',
        type: VariableType.Custom,
        current: ['dev'],
        customOptions: ['dev'],
      },
    ]);
    expect(getActiveVariables()).toBeDefined();
    setActiveVariables(undefined);
    expect(getActiveVariables()).toBeUndefined();
  });

  it('should overwrite previous variables', () => {
    const first: Variable[] = [
      { id: '1', name: 'a', type: VariableType.Custom, current: ['x'], customOptions: ['x'] },
    ];
    const second: Variable[] = [
      { id: '2', name: 'b', type: VariableType.Custom, current: ['y'], customOptions: ['y'] },
    ];
    setActiveVariables(first);
    setActiveVariables(second);
    expect(getActiveVariables()).toBe(second);
  });
});
