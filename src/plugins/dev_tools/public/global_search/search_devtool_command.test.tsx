/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DevToolItem, searchForDevTools } from './search_devtool_command';
import { render } from '@testing-library/react';

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
  const executeTrigger = jest.fn();
  const uiActionsApiFn = jest.fn().mockReturnValue({
    getTrigger: jest.fn().mockReturnValue({
      exec: executeTrigger,
    }),
  });

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
    expect(searchResult[0]).toEqual({
      id: 'console',
      label: 'Console',
      content: expect.any(Object),
      execute: expect.any(Function),
    });

    await searchResult[0].execute();

    expect(uiActionsApiFn).toHaveBeenCalled();
    expect(executeTrigger).toHaveBeenCalledWith({ defaultRoute: 'console' });
  });
});

describe('<DevToolItem />', () => {
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
      />
    );
    expect(container).toMatchSnapshot();
    expect(getByTestId('toolId-dev')).toBeVisible();
  });
});
