/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { shallow } from 'enzyme';

import { ScriptingHelpFlyout } from './help_flyout';

import { DataView } from '../../../../../../data/public';

import { ExecuteScript } from '../../types';

jest.mock('./test_script', () => ({
  TestScript: () => {
    return `<div>mockTestScript</div>`;
  },
}));

const indexPatternMock = {} as DataView;

describe('ScriptingHelpFlyout', () => {
  it('should render normally', async () => {
    const component = shallow(
      <ScriptingHelpFlyout
        isVisible={true}
        dataset={indexPatternMock}
        lang="painless"
        executeScript={((() => {}) as unknown) as ExecuteScript}
        onClose={() => {}}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should render nothing if not visible', async () => {
    const component = shallow(
      <ScriptingHelpFlyout
        isVisible={true}
        dataset={indexPatternMock}
        lang="painless"
        executeScript={((() => {}) as unknown) as ExecuteScript}
        onClose={() => {}}
      />
    );

    expect(component).toMatchSnapshot();
  });
});
