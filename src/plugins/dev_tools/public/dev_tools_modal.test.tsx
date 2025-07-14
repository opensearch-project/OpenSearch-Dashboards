/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { DevToolsModal } from './dev_tools_modal';
import { coreMock } from '../../../core/public/mocks';
import { urlForwardingPluginMock } from 'src/plugins/url_forwarding/public/mocks';
import { uiActionsPluginMock } from 'src/plugins/ui_actions/public/mocks';

const createDepsMock = () => {
  return {
    urlForwarding: urlForwardingPluginMock.createSetupContract(),
    uiActions: uiActionsPluginMock.createSetupContract(),
  };
};

jest.mock('./application', () => ({
  MainApp: () => <div />,
}));

describe('<DevToolsModal />', () => {
  it('should call chrome.navGroup.setCurrentNavGroup and application.navigateToApp methods from core service when click', async () => {
    const coreStartMock = coreMock.createStart();
    const deps = createDepsMock();
    let actionDefinition: Parameters<typeof deps.uiActions.addTriggerAction>[1] | undefined;
    jest.spyOn(deps.uiActions, 'addTriggerAction').mockImplementation((id, action) => {
      actionDefinition = action;
    });
    const { container, findByText } = render(
      <DevToolsModal core={coreStartMock} devTools={[]} deps={deps} title="Dev tools title" />
    );
    expect(container).toMatchInlineSnapshot(`<div />`);

    actionDefinition?.execute({
      trigger: {
        id: '',
      },
    });
    await findByText('Dev tools title');
  });

  it('should register uiActions to show dev tools', async () => {
    const coreStartMock = coreMock.createStart();
    const deps = createDepsMock();
    render(
      <DevToolsModal core={coreStartMock} devTools={[]} deps={deps} title="Dev tools title" />
    );

    expect(deps.uiActions.addTriggerAction).toHaveBeenCalled();
  });
});
