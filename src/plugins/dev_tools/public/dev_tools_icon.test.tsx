/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { DevToolsIcon } from './dev_tools_icon';
import { coreMock } from '../../../core/public/mocks';
import { urlForwardingPluginMock } from 'src/plugins/url_forwarding/public/mocks';

const createDepsMock = () => {
  return {
    urlForwarding: urlForwardingPluginMock.createSetupContract(),
  };
};

jest.mock('./application', () => ({
  MainApp: () => <div />,
}));

describe('<DevToolsIcon />', () => {
  it('should call chrome.navGroup.setCurrentNavGroup and application.navigateToApp methods from core service when click', async () => {
    const coreStartMock = coreMock.createStart();
    const { container, getByTestId, findByText } = render(
      <DevToolsIcon
        core={coreStartMock}
        devTools={[]}
        deps={createDepsMock()}
        title="Dev tools title"
      />
    );
    expect(container).toMatchInlineSnapshot(`
      <div>
        <span
          class="euiToolTipAnchor"
        >
          <button
            aria-label="go-to-dev-tools"
            class="euiButtonIcon euiButtonIcon--primary euiButtonIcon--empty euiButtonIcon--xSmall"
            data-test-subj="openDevToolsModal"
            type="button"
          >
            <span
              aria-hidden="true"
              class="euiButtonIcon__icon"
              color="inherit"
              data-euiicon-type="consoleApp"
            />
          </button>
        </span>
      </div>
    `);

    fireEvent.click(getByTestId('openDevToolsModal'));
    await findByText('Dev tools title');
  });
});
