/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { DevToolsIcon } from './dev_tools_icon';
import { coreMock } from '../../../core/public/mocks';
import { urlForwardingPluginMock } from 'src/plugins/url_forwarding/public/mocks';

const createDepsMock = () => {
  return {
    urlForwarding: urlForwardingPluginMock.createSetupContract(),
  };
};

describe('<DevToolsIcon />', () => {
  it('should call chrome.navGroup.setCurrentNavGroup and application.navigateToApp methods from core service when click', () => {
    const coreStartMock = coreMock.createStart();
    const { container } = render(
      <DevToolsIcon core={coreStartMock} devTools={[]} deps={createDepsMock()} title="Dev tools" />
    );
    expect(container).toMatchInlineSnapshot(`
      <div>
        <button
          aria-label="go-to-dev-tools"
          class="euiButtonIcon euiButtonIcon--primary euiButtonIcon--empty euiButtonIcon--xSmall"
          type="button"
        >
          <span
            aria-hidden="true"
            class="euiButtonIcon__icon"
            color="inherit"
            data-euiicon-type="consoleApp"
          />
        </button>
      </div>
    `);
  });
});
