/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act } from 'react-dom/test-utils';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
// @ts-expect-error TS2306 TODO(ts-error): fixme
import { findTestSubject } from '@elastic/eui/lib/test';

// The query panel pulls in monaco and the services context; it is never rendered
// for Text/Custom variables, so stubbing it keeps these tests focused.
jest.mock('./query_panel/variable_query_panel', () => ({
  VariableQueryPanel: () => <div data-test-subj="mockVariableQueryPanel" />,
}));

import { VariableEditorFlyout } from './variable_editor_flyout';
import { Variable, VariableType } from '../../../variables/types';

const textVariable = (overrides: Partial<Variable> = {}): Variable =>
  ({
    id: 'text-1',
    name: 'keyword',
    type: VariableType.Text,
    current: ['timeout'],
    ...overrides,
  }) as Variable;

const customVariable = (overrides: Partial<Variable> = {}): Variable =>
  ({
    id: 'custom-1',
    name: 'env',
    type: VariableType.Custom,
    current: ['dev'],
    customOptions: ['dev', 'prod'],
    ...overrides,
  }) as Variable;

function mountEditor(existingVariable?: Variable) {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const onClose = jest.fn();
  const component = mountWithIntl(
    <VariableEditorFlyout
      onClose={onClose}
      onSave={onSave}
      existingVariable={existingVariable}
      existingVariables={existingVariable ? [existingVariable] : []}
    />
  );
  return { component, onSave, onClose };
}

async function clickSave(component: any) {
  await act(async () => {
    findTestSubject(component, 'variableEditorSave').simulate('click');
  });
  component.update();
}

describe('VariableEditorFlyout — Text variables', () => {
  it('renders the Value field seeded from the current value', () => {
    const { component } = mountEditor(textVariable());

    const value = findTestSubject(component, 'variableEditorTextValue');
    expect(value.length).toBe(1);
    expect(value.props().value).toBe('timeout');
  });

  it('renders an empty Value field when the variable has no value', () => {
    const { component } = mountEditor(textVariable({ current: undefined }));

    expect(findTestSubject(component, 'variableEditorTextValue').props().value).toBe('');
  });

  it('hides Sort, multi-select and Include All for Text', () => {
    const { component } = mountEditor(textVariable());

    expect(findTestSubject(component, 'variableEditorSort').length).toBe(0);
    expect(findTestSubject(component, 'variableEditorMulti').length).toBe(0);
    expect(findTestSubject(component, 'variableEditorIncludeAll').length).toBe(0);
  });

  it('does not render the query panel or custom options for Text', () => {
    const { component } = mountEditor(textVariable());

    expect(findTestSubject(component, 'mockVariableQueryPanel').length).toBe(0);
    expect(findTestSubject(component, 'variableEditorCustomValues').length).toBe(0);
  });

  it('saves the edited value into `current`', async () => {
    const { component, onSave } = mountEditor(textVariable());

    findTestSubject(component, 'variableEditorTextValue').simulate('change', {
      target: { value: 'latency' },
    });
    await clickSave(component);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'keyword',
        type: VariableType.Text,
        current: ['latency'],
      })
    );
  });

  it('trims the value before saving', async () => {
    const { component, onSave } = mountEditor(textVariable());

    findTestSubject(component, 'variableEditorTextValue').simulate('change', {
      target: { value: '  spaced  ' },
    });
    await clickSave(component);

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ current: ['spaced'] }));
  });

  it('saves an undefined current when the value is cleared (value is optional)', async () => {
    const { component, onSave } = mountEditor(textVariable());

    findTestSubject(component, 'variableEditorTextValue').simulate('change', {
      target: { value: '' },
    });
    await clickSave(component);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ current: undefined }));
  });

  it('does not persist multi/includeAll/sort for Text', async () => {
    const { component, onSave } = mountEditor(textVariable());

    await clickSave(component);

    // These are not applicable to Text, so the keys are omitted entirely rather
    // than sent as undefined.
    const payload = onSave.mock.calls[0][0];
    expect(payload).not.toHaveProperty('multi');
    expect(payload).not.toHaveProperty('includeAll');
    expect(payload).not.toHaveProperty('sort');
  });

  it('offers Text in the type selector', () => {
    const { component } = mountEditor(textVariable());

    expect(findTestSubject(component, 'variableEditorType').text()).toContain('Text');
  });
});

describe('VariableEditorFlyout — non-Text regression', () => {
  it('still renders Sort and multi-select for Custom variables', () => {
    const { component } = mountEditor(customVariable());

    expect(findTestSubject(component, 'variableEditorSort').length).toBe(1);
    expect(findTestSubject(component, 'variableEditorMulti').length).toBe(1);
  });

  it('renders custom options and no Text Value field for Custom variables', () => {
    const { component } = mountEditor(customVariable());

    expect(findTestSubject(component, 'variableEditorCustomValues').length).toBe(1);
    expect(findTestSubject(component, 'variableEditorTextValue').length).toBe(0);
  });

  it('still saves multi/includeAll/sort for Custom variables', async () => {
    const { component, onSave } = mountEditor(customVariable());

    await clickSave(component);

    const payload = onSave.mock.calls[0][0];
    expect(payload.type).toBe(VariableType.Custom);
    expect(payload).toHaveProperty('multi');
    expect(payload).toHaveProperty('includeAll');
    expect(payload).toHaveProperty('sort');
    expect(payload.current).toBeUndefined();
  });
});

describe('VariableEditorFlyout — allowCustomValue', () => {
  it('renders the Allow custom values switch for Custom variables', () => {
    const { component } = mountEditor(customVariable());

    expect(findTestSubject(component, 'variableEditorAllowCustomValue').length).toBe(1);
  });

  it('does not render the Allow custom values switch for Text variables', () => {
    const { component } = mountEditor(textVariable());

    expect(findTestSubject(component, 'variableEditorAllowCustomValue').length).toBe(0);
  });

  it('reflects the existing allowCustomValue state', () => {
    const { component } = mountEditor(customVariable({ allowCustomValue: true }));

    expect(
      findTestSubject(component, 'variableEditorAllowCustomValue').props()['aria-checked']
    ).toBe(true);
  });

  it('defaults to off for a variable that never set it', () => {
    const { component } = mountEditor(customVariable());

    expect(
      findTestSubject(component, 'variableEditorAllowCustomValue').props()['aria-checked']
    ).toBe(false);
  });

  it('saves allowCustomValue when toggled on', async () => {
    const { component, onSave } = mountEditor(customVariable());

    findTestSubject(component, 'variableEditorAllowCustomValue').simulate('click');
    await clickSave(component);

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ allowCustomValue: true }));
  });

  it('saves allowCustomValue=false when toggled off', async () => {
    const { component, onSave } = mountEditor(customVariable({ allowCustomValue: true }));

    findTestSubject(component, 'variableEditorAllowCustomValue').simulate('click');
    await clickSave(component);

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ allowCustomValue: false }));
  });

  it('does not send allowCustomValue for Text variables', async () => {
    const { component, onSave } = mountEditor(textVariable());

    await clickSave(component);

    expect(onSave.mock.calls[0][0]).not.toHaveProperty('allowCustomValue');
  });
});
