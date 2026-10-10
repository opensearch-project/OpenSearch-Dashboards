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
  it('ignores Enter during IME composition and commits a plain Enter once', () => {
    const onValuesChange = jest.fn();
    const component = mountWithIntl(
      <TextValueEditor variable={makeTextVariable()} onValuesChange={onValuesChange} />
    );

    const input = findTestSubject(component, 'variable-text-input');
    input.simulate('change', { target: { value: '지표' } });

    input.simulate('keydown', {
      key: 'Enter',
      keyCode: 229,
      nativeEvent: { isComposing: true },
    });
    expect(onValuesChange).not.toHaveBeenCalled();

    input.simulate('keydown', { key: 'Enter', keyCode: 13, nativeEvent: { isComposing: false } });
    expect(onValuesChange).toHaveBeenCalledTimes(1);
    expect(onValuesChange).toHaveBeenCalledWith('text-1', ['지표']);
  });
});
