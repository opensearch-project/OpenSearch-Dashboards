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

  it('renders a right-aligned info icon in the title when infoTooltip is set', () => {
    const { container, getByLabelText } = render(
      <NavItemPopover
        title="Alerts"
        services={makeServices()}
        navigateToApp={jest.fn()}
        infoTooltip="New alerting hub — alerts, anomaly detection, and SLOs together."
      />
    );
    expect(container.querySelector('.obsNavPopover-titleInfo')).toBeInTheDocument();
    expect(
      getByLabelText('New alerting hub — alerts, anomaly detection, and SLOs together.')
    ).toBeInTheDocument();
  });

  it('renders no title info icon when infoTooltip is absent', () => {
    const { container } = render(
      <NavItemPopover title="Alerts" services={makeServices()} navigateToApp={jest.fn()} />
    );
    expect(container.querySelector('.obsNavPopover-titleInfo')).not.toBeInTheDocument();
  });

  it('renders no title info icon when the title is hidden (showTitle=false)', () => {
    const { container } = render(
      <NavItemPopover
        title="Alerts"
        services={makeServices()}
        navigateToApp={jest.fn()}
        showTitle={false}
        infoTooltip="Some info"
      />
    );
    expect(container.querySelector('.obsNavPopover-titleInfo')).not.toBeInTheDocument();
  });

  it('renders no action buttons when there are no actions', () => {
    const { container } = render(
      <NavItemPopover title="Logs" services={makeServices()} navigateToApp={jest.fn()} />
    );
    expect(
      container.querySelector('[data-test-subj^="obsNavPopoverAction-"]')
    ).not.toBeInTheDocument();
  });

  describe('active trail (itemMatchesApp recursion)', () => {
    it('lights the parent row active when a nested child matches the current appId', () => {
      const { getByTestId } = render(
        <NavItemPopover
          title="Alerting"
          services={makeServices()}
          navigateToApp={jest.fn()}
          appId="destinations"
          childItems={[
            {
              id: 'alerting',
              title: 'Alerting',
              children: [
                { id: 'monitors', title: 'Monitors' },
                { id: 'destinations', title: 'Destinations' },
              ],
            },
          ]}
        />
      );
      // The parent row carries data-active="true" because a descendant matches.
      expect(getByTestId('obsNavPopoverItem-alerting')).toHaveAttribute('data-active', 'true');
    });

    it('lights a leaf row active when the leaf itself is the current appId', () => {
      const { getByTestId } = render(
        <NavItemPopover
          title="Alerting"
          services={makeServices()}
          navigateToApp={jest.fn()}
          appId="monitors"
          childItems={[
            { id: 'monitors', title: 'Monitors' },
            { id: 'alerts', title: 'Alerts' },
          ]}
        />
      );
      expect(getByTestId('obsNavPopoverItem-monitors')).toHaveAttribute('data-active', 'true');
      // A sibling leaf that is not the appId is not active.
      expect(getByTestId('obsNavPopoverItem-alerts')).not.toHaveAttribute('data-active');
    });

    it('does not light a parent whose descendants do not match the current appId', () => {
      const { getByTestId } = render(
        <NavItemPopover
          title="Alerting"
          services={makeServices()}
          navigateToApp={jest.fn()}
          appId="somethingElse"
          childItems={[
            {
              id: 'alerting',
              title: 'Alerting',
              children: [
                { id: 'monitors', title: 'Monitors' },
                { id: 'destinations', title: 'Destinations' },
              ],
            },
          ]}
        />
      );
      expect(getByTestId('obsNavPopoverItem-alerting')).not.toHaveAttribute('data-active');
    });

    it('does not navigate when clicking a parent row (only opens the secondary popover)', () => {
      const navigateToApp = jest.fn();
      const { getByTestId } = render(
        <NavItemPopover
          title="Alerting"
          services={makeServices()}
          navigateToApp={navigateToApp}
          childItems={[
            {
              id: 'alerting',
              title: 'Alerting',
              children: [{ id: 'monitors', title: 'Monitors' }],
            },
          ]}
        />
      );
      fireEvent.click(getByTestId('obsNavPopoverItem-alerting'));
      expect(navigateToApp).not.toHaveBeenCalled();
    });
  });
});
