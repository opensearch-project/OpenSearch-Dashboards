/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { KeyboardEvent, ReactNode } from 'react';
import type { ReactWrapper } from 'enzyme';
import { BehaviorSubject } from 'rxjs';
import { EuiPopover, EuiSelectable } from '@elastic/eui';
import { act } from 'react-dom/test-utils';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
// @ts-expect-error TS2306 TODO(ts-error): fixme
import { findTestSubject } from '@elastic/eui/lib/test';

import { VariablesBar } from './variables_bar';
import { VariableService } from '../../../variables/variable_service';
import { VariableType, VariableWithState } from '../../../variables/types';

const makeTextVariable = (overrides: Partial<VariableWithState> = {}): VariableWithState =>
  ({
    id: 'text-1',
    name: 'keyword',
    type: VariableType.Text,
    current: ['timeout'],
    options: [],
    ...overrides,
  }) as VariableWithState;

const makeCustomVariable = (overrides: Partial<VariableWithState> = {}): VariableWithState =>
  ({
    id: 'custom-1',
    name: 'env',
    type: VariableType.Custom,
    current: ['dev'],
    customOptions: ['dev', 'prod'],
    options: [{ value: 'dev' }, { value: 'prod' }],
    ...overrides,
  }) as VariableWithState;

/**
 * VariablesBar only consumes getVariables$() and updateVariableValue(), so a
 * minimal fake keeps these tests focused on the bar's own rendering/commit logic.
 */
function createFakeService(initial: VariableWithState[]) {
  const variables$ = new BehaviorSubject<VariableWithState[]>(initial);
  const updateVariableValue = jest.fn();
  const service = {
    getVariables$: () => variables$,
    updateVariableValue,
  } as unknown as VariableService;
  return { service, variables$, updateVariableValue };
}

function mountBar(variables: VariableWithState[], isEditMode = false) {
  const { service, variables$, updateVariableValue } = createFakeService(variables);
  const component = mountWithIntl(
    <VariablesBar variableService={service} isEditMode={isEditMode} />
  );
  return { component, variables$, updateVariableValue };
}

describe('VariablesBar — Text variables', () => {
  it('renders a free-text input for a Text variable', () => {
    const { component } = mountBar([makeTextVariable()]);

    const input = findTestSubject(component, 'variable-text-input');
    expect(input.length).toBe(1);
    expect(input.props().value).toBe('timeout');
  });

  it('renders the popover selector (not a text input) for non-Text variables', () => {
    const { component } = mountBar([makeCustomVariable()]);

    expect(findTestSubject(component, 'variable-text-input').length).toBe(0);
    expect(findTestSubject(component, 'variable-selector-button').length).toBe(1);
  });

  it('renders the correct control per type when both are present', () => {
    const { component } = mountBar([makeCustomVariable(), makeTextVariable()]);

    expect(findTestSubject(component, 'variable-text-input').length).toBe(1);
    expect(findTestSubject(component, 'variable-selector-button').length).toBe(1);
  });

  it('shows an empty input when the Text variable has no value', () => {
    const { component } = mountBar([makeTextVariable({ current: undefined })]);

    expect(findTestSubject(component, 'variable-text-input').props().value).toBe('');
  });

  it('commits the typed value on Enter', () => {
    const { component, updateVariableValue } = mountBar([makeTextVariable()]);

    const input = findTestSubject(component, 'variable-text-input');
    input.simulate('change', { target: { value: 'latency' } });
    input.simulate('keydown', { key: 'Enter' });

    expect(updateVariableValue).toHaveBeenCalledTimes(1);
    expect(updateVariableValue).toHaveBeenCalledWith('text-1', ['latency']);
  });

  it('commits the typed value on blur', () => {
    const { component, updateVariableValue } = mountBar([makeTextVariable()]);

    const input = findTestSubject(component, 'variable-text-input');
    input.simulate('change', { target: { value: 'latency' } });
    input.simulate('blur');

    expect(updateVariableValue).toHaveBeenCalledTimes(1);
    expect(updateVariableValue).toHaveBeenCalledWith('text-1', ['latency']);
  });

  it('does not commit while typing (only on Enter/blur)', () => {
    const { component, updateVariableValue } = mountBar([makeTextVariable()]);

    findTestSubject(component, 'variable-text-input').simulate('change', {
      target: { value: 'part' },
    });

    expect(updateVariableValue).not.toHaveBeenCalled();
  });

  it('does not commit when the value is unchanged', () => {
    const { component, updateVariableValue } = mountBar([makeTextVariable()]);

    const input = findTestSubject(component, 'variable-text-input');
    input.simulate('change', { target: { value: 'timeout' } });
    input.simulate('keydown', { key: 'Enter' });

    expect(updateVariableValue).not.toHaveBeenCalled();
  });

  it('commits an empty selection when the value is cleared', () => {
    const { component, updateVariableValue } = mountBar([makeTextVariable()]);

    const input = findTestSubject(component, 'variable-text-input');
    input.simulate('change', { target: { value: '' } });
    input.simulate('blur');

    expect(updateVariableValue).toHaveBeenCalledWith('text-1', []);
  });

  it('ignores other keys', () => {
    const { component, updateVariableValue } = mountBar([makeTextVariable()]);

    const input = findTestSubject(component, 'variable-text-input');
    input.simulate('change', { target: { value: 'latency' } });
    input.simulate('keydown', { key: 'a' });

    expect(updateVariableValue).not.toHaveBeenCalled();
  });

  it('re-syncs the input when the variable value changes externally', () => {
    const { component, variables$ } = mountBar([makeTextVariable()]);

    // e.g. the value was changed from the variable editor — the bar must pick it up.
    act(() => {
      variables$.next([makeTextVariable({ current: ['changed-elsewhere'] })]);
    });
    component.update();

    expect(findTestSubject(component, 'variable-text-input').props().value).toBe(
      'changed-elsewhere'
    );
  });

  it('uses the label as the container label when provided', () => {
    const { component } = mountBar([makeTextVariable({ label: 'Search keyword' })]);

    const container = findTestSubject(component, 'variable-keyword');
    expect(container.props()['data-label']).toBe('Search keyword');
  });

  it('falls back to the name when no label is set', () => {
    const { component } = mountBar([makeTextVariable()]);

    expect(findTestSubject(component, 'variable-keyword').props()['data-label']).toBe('keyword');
  });

  it('does not render hidden Text variables', () => {
    const { component } = mountBar([makeTextVariable({ hide: true })]);

    expect(findTestSubject(component, 'variable-text-input').length).toBe(0);
  });
});

/**
 * The popover's option rows are virtualized, so under jsdom (zero-height
 * container) EuiSelectable renders zero rows and enzyme's simulated change on
 * the EUI search input never reaches searchProps.onSearch. Asserting on that
 * rendered content would pass or fail for the wrong reason.
 *
 * All of the add-custom-value logic lives in the props handed to EuiSelectable
 * (options / onChange / searchProps / listProps), so these tests drive those
 * props directly instead. Returns a getter, since every interaction re-renders.
 */
function openSelector(component: ReactWrapper) {
  findTestSubject(component, 'variable-selector-button').simulate('click');
  component.update();
  return () => {
    component.update();
    return component.find(EuiSelectable).props() as unknown as SelectableProps;
  };
}

interface SelectableOption {
  label: string;
  key?: string;
  checked?: 'on' | 'off';
  append?: unknown;
  'data-test-subj'?: string;
}

interface SelectableProps {
  options: SelectableOption[];
  onChange: (options: SelectableOption[]) => void;
  listProps?: { onFocusBadge?: boolean };
  searchProps: {
    placeholder: string;
    onSearch?: (term: string) => void;
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  };
}

type MockedKeyEvent = KeyboardEvent<HTMLInputElement> & {
  preventDefault: jest.Mock;
  stopPropagation: jest.Mock;
};

const keyEvent = (key: string): MockedKeyEvent =>
  ({
    key,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
  }) as unknown as MockedKeyEvent;

/** Marks the option at `index` as checked, the way EuiSelectable would. */
const check = (options: SelectableOption[], index: number): SelectableOption[] =>
  options.map((option, i) => (i === index ? { ...option, checked: 'on' } : option));

describe('VariablesBar — allowCustomValue: the pending "add" row', () => {
  it('offers the typed value as the first row, with a hint and unchecked', () => {
    const { component } = mountBar([makeCustomVariable({ allowCustomValue: true })]);
    const getProps = openSelector(component);

    act(() => {
      getProps().searchProps.onSearch!('p99');
    });

    const [first, ...rest] = getProps().options;
    expect(first.label).toBe('p99');
    expect(first.checked).toBeUndefined();
    expect(mountWithIntl(<div>{first.append as ReactNode}</div>).text()).toBe('Hit enter to add');
    // The real options keep their place after it.
    expect(rest.map((option) => option.label)).toEqual(['dev', 'prod']);
  });

  it('does not offer a value that is already an option', () => {
    const { component } = mountBar([makeCustomVariable({ allowCustomValue: true })]);
    const getProps = openSelector(component);

    act(() => {
      getProps().searchProps.onSearch!('prod');
    });

    expect(getProps().options.map((option) => option.label)).toEqual(['dev', 'prod']);
    expect(getProps().options.some((option) => option.append)).toBe(false);
  });

  it('does not offer a value that was already committed', () => {
    const { component } = mountBar([
      makeCustomVariable({ allowCustomValue: true, multi: true, current: ['dev', 'p99'] }),
    ]);
    const getProps = openSelector(component);

    act(() => {
      getProps().searchProps.onSearch!('p99');
    });

    expect(getProps().options.some((option) => option.append)).toBe(false);
  });

  it('does not wire up the add-value hooks when the feature is off', () => {
    const { component } = mountBar([makeCustomVariable()]);
    const getProps = openSelector(component);

    expect(getProps().searchProps.onSearch).toBeUndefined();
    expect(getProps().searchProps.placeholder).toBe('Contains...');
  });

  it('advertises the add affordance in the search placeholder when the feature is on', () => {
    const { component } = mountBar([makeCustomVariable({ allowCustomValue: true })]);

    expect(openSelector(component)().searchProps.placeholder).toBe('Contains... or type to add');
  });

  it("hides EUI's per-row enter badge only while a value is pending", () => {
    const { component } = mountBar([makeCustomVariable({ allowCustomValue: true })]);
    const getProps = openSelector(component);

    expect(getProps().listProps).toBeUndefined();

    act(() => {
      getProps().searchProps.onSearch!('p99');
    });

    // The badge tracks EuiSelectable's own focused row, but Enter adds the pending
    // value instead — leaving it visible would point it at the wrong row.
    expect(getProps().listProps).toEqual({ onFocusBadge: false });
  });
});

describe('VariablesBar — allowCustomValue: committing', () => {
  it('commits the typed value exactly once on Enter for a single-select variable', () => {
    const { component, updateVariableValue } = mountBar([
      makeCustomVariable({ allowCustomValue: true, multi: false }),
    ]);
    const getProps = openSelector(component);

    act(() => {
      getProps().searchProps.onSearch!('p99');
    });
    const event = keyEvent('Enter');
    act(() => {
      getProps().searchProps.onKeyDown(event);
    });

    expect(updateVariableValue).toHaveBeenCalledTimes(1);
    expect(updateVariableValue).toHaveBeenCalledWith('custom-1', ['p99']);
    // Regression guard. Without stopPropagation, EuiSelectable's own Enter handler
    // also runs and, under singleSelection, its onAddOption clears `checked` on
    // every option and re-checks by object identity — a stale identity then emits
    // an all-unchecked array, which wipes the variable's value.
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it('replaces the selection for a single-select variable', () => {
    const { component, updateVariableValue } = mountBar([
      makeCustomVariable({ allowCustomValue: true, multi: false, current: ['dev'] }),
    ]);
    const getProps = openSelector(component);

    act(() => {
      getProps().searchProps.onSearch!('p99');
    });
    act(() => {
      getProps().searchProps.onKeyDown(keyEvent('Enter'));
    });

    expect(updateVariableValue).toHaveBeenCalledWith('custom-1', ['p99']);
  });

  it('appends to the selection for a multi-select variable', () => {
    const { component, updateVariableValue } = mountBar([
      makeCustomVariable({ allowCustomValue: true, multi: true, current: ['dev', 'prod'] }),
    ]);
    const getProps = openSelector(component);

    act(() => {
      getProps().searchProps.onSearch!('p99');
    });
    act(() => {
      getProps().searchProps.onKeyDown(keyEvent('Enter'));
    });

    expect(updateVariableValue).toHaveBeenCalledWith('custom-1', ['dev', 'prod', 'p99']);
  });

  it('commits when the row is picked instead of typing Enter', () => {
    const { component, updateVariableValue } = mountBar([
      makeCustomVariable({ allowCustomValue: true, multi: true, current: ['dev'] }),
    ]);
    const getProps = openSelector(component);

    act(() => {
      getProps().searchProps.onSearch!('p99');
    });
    act(() => {
      getProps().onChange(check(getProps().options, 0));
    });

    // Not stored as an ordinary selection — the row is a synthetic affordance.
    expect(updateVariableValue).toHaveBeenCalledWith('custom-1', ['dev', 'p99']);
  });

  it('leaves a plain Enter to EuiSelectable when there is nothing to add', () => {
    const { component, updateVariableValue } = mountBar([
      makeCustomVariable({ allowCustomValue: true }),
    ]);
    const getProps = openSelector(component);

    // 'dev' is an existing option, so no value is pending.
    act(() => {
      getProps().searchProps.onSearch!('dev');
    });
    const event = keyEvent('Enter');
    act(() => {
      getProps().searchProps.onKeyDown(event);
    });

    expect(updateVariableValue).not.toHaveBeenCalled();
    expect(event.stopPropagation).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('ignores keys other than Enter', () => {
    const { component, updateVariableValue } = mountBar([
      makeCustomVariable({ allowCustomValue: true }),
    ]);
    const getProps = openSelector(component);

    act(() => {
      getProps().searchProps.onSearch!('p99');
    });
    act(() => {
      getProps().searchProps.onKeyDown(keyEvent('a'));
    });

    expect(updateVariableValue).not.toHaveBeenCalled();
  });

  it('closes the popover after a single-select commit but keeps it open for multi', () => {
    // Assert our own isOpen state rather than whether the panel is still mounted:
    // EuiPopover keeps the panel around during its close transition.
    const isOpen = (wrapper: ReactWrapper) => {
      wrapper.update();
      return wrapper.find(EuiPopover).first().props().isOpen;
    };

    const single = mountBar([makeCustomVariable({ allowCustomValue: true, multi: false })]);
    const singleProps = openSelector(single.component);
    expect(isOpen(single.component)).toBe(true);
    act(() => {
      singleProps().searchProps.onSearch!('p99');
    });
    act(() => {
      singleProps().searchProps.onKeyDown(keyEvent('Enter'));
    });
    expect(isOpen(single.component)).toBe(false);

    const multi = mountBar([makeCustomVariable({ allowCustomValue: true, multi: true })]);
    const multiProps = openSelector(multi.component);
    act(() => {
      multiProps().searchProps.onSearch!('p99');
    });
    act(() => {
      multiProps().searchProps.onKeyDown(keyEvent('Enter'));
    });
    expect(isOpen(multi.component)).toBe(true);
  });
});

describe('VariablesBar — allowCustomValue: committed values in the list', () => {
  it('renders committed off-list values as checked rows', () => {
    const { component } = mountBar([
      makeCustomVariable({
        allowCustomValue: true,
        multi: true,
        current: ['dev', 'p99', 'p50'],
      }),
    ]);

    const options = openSelector(component)().options;
    expect(options.map((option) => option.label)).toEqual(['dev', 'prod', 'p99', 'p50']);

    // They need real rows, otherwise they would be invisible and un-deselectable.
    const custom = options.filter(
      (option) => option['data-test-subj'] === 'variable-custom-value-option'
    );
    expect(custom.map((option) => option.label)).toEqual(['p99', 'p50']);
    expect(custom.every((option) => option.checked === 'on')).toBe(true);
  });

  it('de-selects a committed custom value through its row', () => {
    const { component, updateVariableValue } = mountBar([
      makeCustomVariable({ allowCustomValue: true, multi: true, current: ['dev', 'p99'] }),
    ]);
    const getProps = openSelector(component);

    const options = getProps().options;
    const withoutP99 = options.map((option) =>
      option.label === 'p99' ? { ...option, checked: undefined } : option
    );
    act(() => {
      getProps().onChange(withoutP99);
    });

    expect(updateVariableValue).toHaveBeenCalledWith('custom-1', ['dev']);
  });

  it('does not fabricate rows for off-list values when the feature is off', () => {
    const { component } = mountBar([makeCustomVariable({ multi: true, current: ['dev', 'p99'] })]);

    expect(openSelector(component)().options.map((option) => option.label)).toEqual([
      'dev',
      'prod',
    ]);
  });

  it('keeps custom values when "All" is checked', () => {
    const { component, updateVariableValue } = mountBar([
      makeCustomVariable({
        allowCustomValue: true,
        multi: true,
        includeAll: true,
        current: ['p99'],
      }),
    ]);
    const getProps = openSelector(component);

    const options = getProps().options;
    const allIndex = options.findIndex((option) => option.label === 'All');
    act(() => {
      getProps().onChange(check(options, allIndex));
    });

    // "All" covers the listed options only.
    expect(updateVariableValue).toHaveBeenCalledWith('custom-1', ['dev', 'prod', 'p99']);
  });

  it('keeps custom values when "All" is unchecked', () => {
    const { component, updateVariableValue } = mountBar([
      makeCustomVariable({
        allowCustomValue: true,
        multi: true,
        includeAll: true,
        current: ['dev', 'prod', 'p99'],
      }),
    ]);
    const getProps = openSelector(component);

    const options = getProps().options;
    const uncheckedAll = options.map((option) =>
      option.label === 'All' ? { ...option, checked: undefined } : option
    );
    act(() => {
      getProps().onChange(uncheckedAll);
    });

    expect(updateVariableValue).toHaveBeenCalledWith('custom-1', ['p99']);
  });

  it('counts custom values in the multi-select badge', () => {
    const { component } = mountBar([
      makeCustomVariable({
        allowCustomValue: true,
        multi: true,
        current: ['dev', 'custom-a', 'custom-b'],
      }),
    ]);

    expect(findTestSubject(component, 'variable-selector-button').text()).toContain('3');
  });

  it('does not claim plain "All" when custom values are also selected', () => {
    const { component } = mountBar([
      makeCustomVariable({
        allowCustomValue: true,
        multi: true,
        includeAll: true,
        // every listed option plus an off-list value
        current: ['dev', 'prod', 'custom-a'],
      }),
    ]);

    const buttonText = findTestSubject(component, 'variable-selector-button').text();
    expect(buttonText).not.toBe('All');
    expect(buttonText).toContain('3');
  });
});
