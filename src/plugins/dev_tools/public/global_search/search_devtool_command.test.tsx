/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DevToolItem, searchForDevTools } from './search_devtool_command';
import { fireEvent, render } from '@testing-library/react';
import { uiActionsPluginMock } from 'src/plugins/ui_actions/public/mocks';
import { DEVTOOL_TRIGGER_ID } from '../plugin';

describe('DevtoolSearchCommand', () => {
  const devToolsFn = jest.fn().mockReturnValue([
    {
      id: 'console',
      title: 'Console',
    },
    {
      id: 'others',
      title: 'others dev tools',
    },
  ]);
  const uiActionsApiFn = jest.fn();

  it('searchForDevTools without any match', async () => {
    const searchResult = await searchForDevTools('query', {
      devTools: devToolsFn,
      title: 'Dev tools',
      uiActionsApi: uiActionsApiFn,
    });

    expect(searchResult).toHaveLength(0);
  });

  it('searchForDevTools matches category', async () => {
    const searchResult = await searchForDevTools('dev', {
      devTools: devToolsFn,
      title: 'Dev tools',
      uiActionsApi: uiActionsApiFn,
    });

    // match all sub apps
    expect(searchResult).toHaveLength(2);
  });

  it('searchForDevTools with match tool', async () => {
    const searchResult = await searchForDevTools('console', {
      devTools: devToolsFn,
      title: 'Dev tools',
      uiActionsApi: uiActionsApiFn,
    });

    expect(searchResult).toHaveLength(1);
    expect(searchResult[0]).toMatchInlineSnapshot(`
      <DevToolItem
        breadcrumbs={
          Array [
            Object {
              "text": <EuiFlexGroup
                alignItems="center"
                gutterSize="s"
              >
                <EuiFlexItem>
                  <EuiIcon
                    color="text"
                    type="consoleApp"
                  />
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiHighlight
                    search="console"
                  >
                    Dev tools
                  </EuiHighlight>
                </EuiFlexItem>
              </EuiFlexGroup>,
            },
            Object {
              "onClick": [Function],
              "text": <EuiHighlight
                search="console"
              >
                Console
              </EuiHighlight>,
            },
          ]
        }
        toolId="console"
      />
    `);
  });
});

describe('<DevToolItem />', () => {
  const uiActionsStartMock = uiActionsPluginMock.createStartContract();
  uiActionsStartMock.getTrigger.mockReturnValue({
    id: '',
    exec: jest.fn(),
  });
  // test component DevToolItem
  it('render DevToolItem', () => {
    // render component with jest
    const { container, getByTestId } = render(
      <DevToolItem
        breadcrumbs={[
          {
            text: 'Dev tools',
          },
        ]}
        toolId="dev"
        uiActionsApi={uiActionsStartMock}
      />
    );
    expect(container).toMatchSnapshot();
    fireEvent.click(getByTestId('toolId-dev'));
    expect(uiActionsStartMock.getTrigger).toHaveBeenCalledWith(DEVTOOL_TRIGGER_ID);
  });
});
