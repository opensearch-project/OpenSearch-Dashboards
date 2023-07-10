/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppContainer } from './app_container';
import { render } from '@testing-library/react';
import { View } from '../services/view_service/view';
import { ViewMountParameters } from '../services/view_service';

describe('DataExplorerApp', () => {
  const createView = () => {
    return new View({
      id: 'test-view',
      title: 'Test View',
      defaultPath: '/test-path',
      appExtentions: {} as any,
      mount: async ({ canvasElement, panelElement }: ViewMountParameters) => {
        const canvasContent = document.createElement('div');
        const panelContent = document.createElement('div');
        canvasContent.innerHTML = 'canvas-content';
        panelContent.innerHTML = 'panel-content';
        canvasElement.appendChild(canvasContent);
        panelElement.appendChild(panelContent);
        return () => {
          canvasContent.remove();
          panelContent.remove();
        };
      },
    });
  };

  it('should render NoView when a non existent view is selected', () => {
    const { container } = render(<AppContainer />);

    expect(container).toContainHTML('View not found');
  });

  // TODO: Complete once state management is in place
  // it('should render the canvas and panel when selected', () => {
  //   const view = createView();
  //   const { container } = render(<AppContainer view={view} />);

  //   expect(container).toMatchSnapshot();
  // });
});
