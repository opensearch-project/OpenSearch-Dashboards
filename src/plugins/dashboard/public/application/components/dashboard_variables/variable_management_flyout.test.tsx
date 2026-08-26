/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { of } from 'rxjs';
import { EuiIcon } from '@elastic/eui';
import { mountWithIntl } from 'test_utils/enzyme_helpers';

const mockNotifications = {
  toasts: { addSuccess: jest.fn(), addDanger: jest.fn() },
};

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: { notifications: mockNotifications },
  }),
}));

jest.mock('@elastic/eui', () => {
  const actual = jest.requireActual('@elastic/eui');
  return {
    ...actual,
    EuiDragDropContext: ({ children }: any) => <div>{children}</div>,
    EuiDroppable: ({ children }: any) => <div>{children}</div>,
    EuiDraggable: ({ children }: any) =>
      typeof children === 'function' ? children({ dragHandleProps: {} }) : children,
  };
});

import { VariableManagementFlyout } from './variable_management_flyout';
import { VariableType, VariableWithState } from '../../../variables/types';

function referencedIconCount(component: any): number {
  return component.find(EuiIcon).filterWhere((n: any) => n.prop('color') === 'success').length;
}

function mockService(variables: VariableWithState[]) {
  return {
    getVariables$: () => of(variables),
    reorderVariables: jest.fn(),
    removeVariable: jest.fn(),
    toggleVariableHide: jest.fn(),
  } as unknown as any;
}

function mountFlyout(variables: VariableWithState[], panelQueries: string[] = []) {
  return mountWithIntl(
    <VariableManagementFlyout
      variableService={mockService(variables)}
      onClose={jest.fn()}
      onAddVariable={jest.fn()}
      onEditVariable={jest.fn()}
      panelQueries={panelQueries}
    />
  );
}

const freeTextQueryVar = (overrides: Partial<any> = {}): VariableWithState =>
  ({
    id: 'q1',
    name: 'svc',
    type: VariableType.Query,
    sourceKind: 'queryResult',
    query: 'source=logs | fields service',
    language: 'PPL',
    ...overrides,
  }) as VariableWithState;

const prometheusVar = (overrides: Partial<any> = {}): VariableWithState =>
  ({
    id: 'p1',
    name: 'promvar',
    type: VariableType.Query,
    sourceKind: 'prometheusResource',
    language: 'PROMQL',
    promQLResourceQuery: { kind: 'labelNames' },
    ...overrides,
  }) as VariableWithState;

describe('VariableManagementFlyout — isReferenced (PromQL resource queries)', () => {
  it('flags a variable referenced by a prometheusResource query type field', () => {
    // `target` is referenced from another PromQL variable's labelValues metric field.
    const target = freeTextQueryVar({ id: 't', name: 'target', query: '' });
    const referencing = prometheusVar({
      promQLResourceQuery: { kind: 'labelValues', label: 'instance', metric: '${target}' },
    });

    const component = mountFlyout([target, referencing]);

    // Only `target` is referenced; the PromQL variable itself is not.
    expect(referencedIconCount(component)).toBe(1);
  });

  it('detects references inside a labelValues matcher value', () => {
    const target = freeTextQueryVar({ id: 't', name: 'target', query: '' });
    const referencing = prometheusVar({
      promQLResourceQuery: {
        kind: 'labelValues',
        label: 'instance',
        matchers: [{ label: 'job', operator: '=', value: '$target' }],
      },
    });

    const component = mountFlyout([target, referencing]);

    expect(referencedIconCount(component)).toBe(1);
  });

  it('detects references inside a series matcher', () => {
    const target = freeTextQueryVar({ id: 't', name: 'target', query: '' });
    const referencing = prometheusVar({
      promQLResourceQuery: { kind: 'series', matcher: 'up{job="${target}"}' },
    });

    const component = mountFlyout([target, referencing]);

    expect(referencedIconCount(component)).toBe(1);
  });

  it('does not flag when no PromQL field references the variable', () => {
    const target = freeTextQueryVar({ id: 't', name: 'target', query: '' });
    const unrelated = prometheusVar({
      promQLResourceQuery: { kind: 'labelValues', label: 'instance', metric: 'node_cpu' },
    });

    const component = mountFlyout([target, unrelated]);

    expect(referencedIconCount(component)).toBe(0);
  });

  it('still detects references from a free-text query variable', () => {
    const target = freeTextQueryVar({ id: 't', name: 'target', query: '' });
    const referencing = freeTextQueryVar({
      id: 'r',
      name: 'other',
      query: 'source=logs | where svc="${target}"',
    });

    const component = mountFlyout([target, referencing]);

    expect(referencedIconCount(component)).toBe(1);
  });
});
