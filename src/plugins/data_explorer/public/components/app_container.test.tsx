/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppContainer } from './app_container';
import { View } from '../services/view_service/view';
import { AppMountParameters } from '../../../../core/public';
import { render } from 'test_utils/testing_lib_helpers';

describe('DataExplorerApp', () => {
  const createView = () => {
    return new View({
      id: 'test-view',
      title: 'Test View',
      defaultPath: '/test-path',
      appExtentions: {} as any,
      Canvas: (() => <div>canvas</div>) as any,
      Panel: (() => <div>panel</div>) as any,
      Context: (() => <div>Context</div>) as any,
    });
  };

  const params: AppMountParameters = {
    element: document.createElement('div'),
    history: {} as any,
    onAppLeave: jest.fn(),
    setHeaderActionMenu: jest.fn(),
    appBasePath: '',
  };

  it('should render NoView when a non existent view is selected', () => {
    const { container } = render(<AppContainer params={params} />);

    expect(container).toContainHTML('View not found');
  });

  it('should render the canvas and panel when selected', () => {
    const view = createView();
    const { container } = render(<AppContainer view={view} params={params} />);

    expect(container).toMatchSnapshot();
  });
});
