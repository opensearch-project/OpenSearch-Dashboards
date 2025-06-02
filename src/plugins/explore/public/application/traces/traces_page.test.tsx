/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TracesPage } from './traces_page';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { render } from 'test_utils/testing_lib_helpers';

jest.mock('../legacy/discover/application/view_components/canvas', () => ({
  default: () => <div>canvas</div>,
}));

jest.mock('../legacy/discover/application/view_components/panel', () => ({
  default: () => <div>panel</div>,
}));

jest.mock('../legacy/discover/application/view_components/context', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../../ui_metric', () => ({
  trackUiMetric: jest.fn(),
}));

describe('TracesPage', () => {
  const params: AppMountParameters = {
    element: document.createElement('div'),
    history: {} as any,
    onAppLeave: jest.fn(),
    setHeaderActionMenu: jest.fn(),
    appBasePath: '',
  };

  it('should render the traces page component', () => {
    const { container } = render(<TracesPage params={params} />);

    expect(container).toMatchSnapshot();
  });
});
