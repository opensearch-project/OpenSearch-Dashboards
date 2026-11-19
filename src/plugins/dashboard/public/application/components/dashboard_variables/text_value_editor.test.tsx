/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mountWithIntl } from 'test_utils/enzyme_helpers';
// @ts-expect-error TS2306 TODO(ts-error): fixme
import { findTestSubject } from '@elastic/eui/lib/test';

import { TextValueEditor } from './text_value_editor';
import { VariableType, VariableWithState } from '../../../variables/types';

const makeTextVariable = (): VariableWithState =>
  ({
    id: 'text-1',
    name: 'keyword',
    type: VariableType.Text,
    current: [],
    options: [],
  }) as VariableWithState;

describe('TextValueEditor', () => {
  it('commits the value once on Enter', () => {
    const onValuesChange = jest.fn();
    const component = mountWithIntl(
      <TextValueEditor variable={makeTextVariable()} onValuesChange={onValuesChange} />
    );

    const input = findTestSubject(component, 'variable-text-input');
    input.simulate('change', { target: { value: 'error' } });

    input.simulate('keydown', { key: 'Enter', keyCode: 13 });
    expect(onValuesChange).toHaveBeenCalledTimes(1);
    expect(onValuesChange).toHaveBeenCalledWith('text-1', ['error']);
  });
});
