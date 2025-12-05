/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { shallow } from 'enzyme';

import { ScriptingDisabledCallOut } from './disabled_call_out';

describe('ScriptingDisabledCallOut', () => {
  it('should render normally', async () => {
    const component = shallow(<ScriptingDisabledCallOut isVisible={true} />);

    expect(component).toMatchSnapshot();
  });

  it('should render nothing if not visible', async () => {
    const component = shallow(<ScriptingDisabledCallOut />);

    expect(component).toMatchSnapshot();
  });
});
