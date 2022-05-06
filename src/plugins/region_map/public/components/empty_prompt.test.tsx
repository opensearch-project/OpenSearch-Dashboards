/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import EmptyPrompt from './empty_prompt';

describe('empty_prompt', () => {
  it('renders the Empty Prompt based on props provided', () => {
    const wrapper = shallow(
      <EmptyPrompt iconType="test" title="test" bodyFragment="test" actions="" />
    );
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
