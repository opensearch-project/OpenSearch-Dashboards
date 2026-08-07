/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act } from 'react-dom/test-utils';
import { unmountComponentAtNode } from 'react-dom';
import { setTypes } from '../services';
import { TypesService } from '../vis_types';
import { PersistedState } from '../persisted_state';
import { ExprVis } from './vis';
import { visualization } from './visualization_renderer';

jest.mock('../components', () => ({
  Visualization: ({ visData, visParams, uiState, listenOnChange }) => (
    <div>
      <span>Visualization</span>
      <span>{JSON.stringify(visData)}</span>
      <span>{JSON.stringify(visParams)}</span>
      <span>{JSON.stringify(uiState)}</span>
      <span>{listenOnChange.toString()}</span>
    </div>
  ),
}));

describe('visualization', () => {
  let domNode: HTMLDivElement;
  let handlers: Parameters<ReturnType<typeof visualization>['render']>[2];

  beforeAll(() => {
    const typeService = new TypesService();
    const typeSetup = typeService.setup();
    const typeStart = typeService.start();
    typeSetup.createReactVisualization({
      name: 'pie',
      title: 'Controls',
      icon: 'controlsHorizontal',
      stage: 'experimental',
      visConfig: {
        defaults: {
          controls: [],
          updateFiltersOnChange: false,
          useTimeFilter: false,
          pinFilters: false,
        },
        component: () => <div />,
      },
      inspectorAdapters: {},
      requestHandler: 'none',
      responseHandler: 'none',
    });
    setTypes(typeStart);
  });

  beforeEach(() => {
    domNode = document.createElement('div');
    handlers = {
      event: jest.fn(),
      done: jest.fn(),
      onDestroy: jest.fn(),
      reload: jest.fn(),
      update: jest.fn(),
    };
    document.body.appendChild(domNode);
  });

  afterEach(() => {
    jest.clearAllMocks();
    unmountComponentAtNode(domNode);
    document.body.removeChild(domNode);
  });

  it('should render the Visualization component', async () => {
    const config = {
      visType: '',
      visData: { data: [1, 2, 3] },
      visConfig: { type: 'pie' },
      params: { listenOnChange: true },
    };

    await act(async () => {
      await visualization().render(domNode, config, handlers);
    });

    expect(domNode.textContent).toContain('Visualization');
    expect(domNode.textContent).toContain('{"data":[1,2,3]}');
    expect(domNode.textContent).toContain('true');
  });

  it('should call setUiState if vis uiState not matched', async () => {
    const config = {
      visType: 'pie',
      visData: { data: [1, 2, 3] },
      visConfig: { type: 'pie' },
      params: { listenOnChange: false },
    };
    const uiState = new PersistedState({ vis: { colors: { brand: '#000' } } });
    handlers.uiState = uiState;

    const getUiStateMock = jest.spyOn(ExprVis.prototype, 'getUiState').mockReturnValueOnce(uiState);
    const setUiStateMock = jest.spyOn(ExprVis.prototype, 'setUiState');

    await act(async () => {
      await visualization().render(domNode, config, handlers);
    });
    const newUIState = new PersistedState();

    handlers.uiState = newUIState;
    await act(async () => {
      await visualization().render(domNode, config, handlers);
    });
    getUiStateMock.mockReturnValueOnce(newUIState);
    expect(setUiStateMock).toHaveBeenCalledWith(newUIState);
  });

  it('should unmount the component on destroy', async () => {
    let destroyFn: Function;
    jest.spyOn(handlers, 'onDestroy').mockImplementationOnce((fn) => {
      destroyFn = fn;
    });
    const config = {
      visType: '',
      visData: { data: [1, 2, 3] },
      visConfig: { type: 'pie' },
      params: { listenOnChange: false },
    };

    await act(async () => {
      await visualization().render(domNode, config, handlers);
    });

    await act(async () => {
      destroyFn();
    });

    expect(domNode.textContent).not.toContain('Visualization');
  });
});
