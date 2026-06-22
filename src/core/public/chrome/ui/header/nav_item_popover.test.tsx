/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, fireEvent } from '@testing-library/react';
import { of } from 'rxjs';
import { NavItemPopover } from './nav_item_popover';
import { NavPopoverServices } from '../../nav_group';
import { httpServiceMock } from '../../../mocks';

const mockBasePath = httpServiceMock.createSetupContract({ basePath: '/test' }).basePath;

const makeServices = (navigateToApp = jest.fn()): NavPopoverServices => ({
  navigateToApp,
  basePath: mockBasePath,
  http: httpServiceMock.createStartContract(),
  recentlyAccessed$: of([]),
});

describe('<NavItemPopover />', () => {
  it('renders the title', () => {
    const { getByText } = render(
      <NavItemPopover title="Dashboards" services={makeServices()} navigateToApp={jest.fn()} />
    );
    expect(getByText('Dashboards')).toBeInTheDocument();
  });

  it('renders declarative actions and fires onClick with services', () => {
    const services = makeServices();
    const onClick = jest.fn();
    const { getByTestId } = render(
      <NavItemPopover
        title="Logs"
        navPopover={{ actions: [{ id: 'new', label: 'New log search', onClick }] }}
        services={services}
        navigateToApp={jest.fn()}
      />
    );
    fireEvent.click(getByTestId('obsNavPopoverAction-new'));
    expect(onClick).toHaveBeenCalledWith(services);
  });

  it('renders custom content via render()', () => {
    const { getByTestId } = render(
      <NavItemPopover
        title="Dashboards"
        navPopover={{ render: () => <div data-test-subj="custom">Recent</div> }}
        services={makeServices()}
        navigateToApp={jest.fn()}
      />
    );
    expect(getByTestId('custom')).toBeInTheDocument();
  });

  it('renders a child list and navigates on click', () => {
    const navigateToApp = jest.fn();
    const { getByTestId } = render(
      <NavItemPopover
        title="Alerting"
        services={makeServices()}
        navigateToApp={navigateToApp}
        childItems={[
          { id: 'alerts', title: 'Alerts' },
          { id: 'monitors', title: 'Monitors' },
        ]}
      />
    );
    expect(getByTestId('obsNavPopover-children')).toBeInTheDocument();
    fireEvent.click(getByTestId('obsNavPopoverItem-alerts'));
    expect(navigateToApp).toHaveBeenCalledWith('alerts');
  });

  it('renders no action buttons when there are no actions', () => {
    const { container } = render(
      <NavItemPopover title="Logs" services={makeServices()} navigateToApp={jest.fn()} />
    );
    expect(
      container.querySelector('[data-test-subj^="obsNavPopoverAction-"]')
    ).not.toBeInTheDocument();
  });
});
