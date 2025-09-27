/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { shallow } from 'enzyme';

import { CallOuts } from '../call_outs';

describe('CallOuts', () => {
  test('should render normally', () => {
    const component = shallow(
      <CallOuts
        deprecatedLangsInUse={['php']}
        painlessDocLink="http://www.opensearch.org/painlessDocs"
      />
    );

    expect(component).toMatchSnapshot();
  });

  test('should render without any call outs', () => {
    const component = shallow(
      <CallOuts
        deprecatedLangsInUse={[]}
        painlessDocLink="http://www.opensearch.org/painlessDocs"
      />
    );

    expect(component).toMatchSnapshot();
  });
});
