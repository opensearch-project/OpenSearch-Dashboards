/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { AppContainer } from './app_container';
import { View } from '../services/view_service/view';
import { AppMountParameters } from '../../../../core/public';
import { render } from 'test_utils/testing_lib_helpers';

const mockChromeVisible$ = new BehaviorSubject<boolean>(true);

jest.mock('../../../opensearch_dashboards_react/public', () => ({
  ...jest.requireActual('../../../opensearch_dashboards_react/public'),
  useOpenSearchDashboards: () => ({
    services: {
      chrome: {
        getIsVisible$: () => mockChromeVisible$,
      },
    },
  }),
}));

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

  // @ts-expect-error TS2740 TODO(ts-error): fixme
  const params: AppMountParameters = {
    element: document.createElement('div'),
    history: {} as any,
    onAppLeave: jest.fn(),
    setHeaderActionMenu: jest.fn(),
    appBasePath: '',
  };

  beforeEach(() => {
    mockChromeVisible$.next(true);
  });

  it('should render NoView when a non existent view is selected', () => {
    const { container } = render(<AppContainer params={params} />);

    expect(container).toContainHTML('View not found');
  });

  it('should render the canvas and panel when selected', () => {
    const view = createView();
    const { container } = render(<AppContainer view={view} params={params} />);

    expect(container).toMatchSnapshot();
  });

  it('should not add deLayout--chromeHidden class when chrome is visible', () => {
    mockChromeVisible$.next(true);
    const view = createView();
    const { container } = render(<AppContainer view={view} params={params} />);

    const deLayout = container.querySelector('.deLayout');
    expect(deLayout).toBeInTheDocument();
    expect(deLayout).not.toHaveClass('deLayout--chromeHidden');
  });

  it('should add deLayout--chromeHidden class when chrome is hidden', () => {
    mockChromeVisible$.next(false);
    const view = createView();
    const { container } = render(<AppContainer view={view} params={params} />);

    const deLayout = container.querySelector('.deLayout');
    expect(deLayout).toBeInTheDocument();
    expect(deLayout).toHaveClass('deLayout--chromeHidden');
  });
});
