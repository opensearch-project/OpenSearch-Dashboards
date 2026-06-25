/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, fireEvent } from '@testing-library/react';
import { of } from 'rxjs';
import { CollapsedSideNav, CollapsedSideNavProps } from './collapsed_side_nav';
import { ChromeNavLink } from '../../nav_links';
import { ChromeRegistrationNavLink, NavPopoverServices } from '../../nav_group';
import { httpServiceMock } from '../../../mocks';
import { DEFAULT_APP_CATEGORIES } from '../../../../../core/utils';

const mockBasePath = httpServiceMock.createSetupContract({ basePath: '/test' }).basePath;

const makePopoverServices = (): NavPopoverServices => ({
  navigateToApp: jest.fn(),
  basePath: mockBasePath,
  http: httpServiceMock.createStartContract(),
  recentlyAccessed$: of([]),
});

type MergedNavLink = ChromeNavLink & ChromeRegistrationNavLink;

const makeLink = (partial: Partial<MergedNavLink>): MergedNavLink =>
  ({
    id: '',
    title: '',
    baseUrl: '',
    href: '',
    ...partial,
  } as MergedNavLink);

describe('<CollapsedSideNav />', () => {
  const defaultProps: CollapsedSideNavProps = {
    navLinks: [],
    appId: '',
    navigateToApp: jest.fn(),
    basePath: mockBasePath,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state without errors', () => {
    const { getByTestId } = render(<CollapsedSideNav {...defaultProps} />);
    expect(getByTestId('obsCollapsedNav')).toBeInTheDocument();
  });

  it('renders icon buttons for flat nav links', () => {
    const navLinks = [
      makeLink({ id: 'logs', title: 'Logs', euiIconType: 'logsApp' }),
      makeLink({ id: 'metrics', title: 'Metrics', euiIconType: 'metricsApp' }),
    ];
    const { getByTestId } = render(<CollapsedSideNav {...defaultProps} navLinks={navLinks} />);
    expect(getByTestId('obsCollapsedIcon-logs')).toBeInTheDocument();
    expect(getByTestId('obsCollapsedIcon-metrics')).toBeInTheDocument();
  });

  it('marks the active link with the active anchor class (grey fill + accent bar)', () => {
    const navLinks = [
      makeLink({ id: 'logs', title: 'Logs', euiIconType: 'logsApp' }),
      makeLink({ id: 'metrics', title: 'Metrics', euiIconType: 'metricsApp' }),
    ];
    const { getByTestId } = render(
      <CollapsedSideNav {...defaultProps} navLinks={navLinks} appId="logs" />
    );
    // The selected icon's anchor wrapper carries the active treatment
    // (full-rail grey + blue vertical accent bar), mirroring the expanded row.
    const activeAnchor = getByTestId('obsCollapsedIcon-logs').closest('.obsSimplePopover-anchor');
    expect(activeAnchor?.classList.toString()).toContain('obsSimplePopover-anchor--active');
    // The non-active icon does not.
    const inactiveAnchor = getByTestId('obsCollapsedIcon-metrics').closest(
      '.obsSimplePopover-anchor'
    );
    expect(inactiveAnchor?.classList.toString()).not.toContain('obsSimplePopover-anchor--active');
  });

  it('navigates on leaf icon click', () => {
    const navigateToApp = jest.fn();
    const navLinks = [makeLink({ id: 'logs', title: 'Logs', euiIconType: 'logsApp' })];
    const { getByTestId } = render(
      <CollapsedSideNav {...defaultProps} navLinks={navLinks} navigateToApp={navigateToApp} />
    );
    fireEvent.click(getByTestId('obsCollapsedIcon-logs'));
    expect(navigateToApp).toHaveBeenCalledWith('logs');
  });

  it('renders cluster gap between sections', () => {
    const toolsCategory = {
      ...DEFAULT_APP_CATEGORIES.observabilityTools,
      collapsible: true,
      euiIconType: 'wrench' as const,
    };
    const navLinks = [
      makeLink({ id: 'logs', title: 'Logs', euiIconType: 'logsApp' }),
      makeLink({ id: 'tool1', title: 'Tool 1', euiIconType: 'wrench', category: toolsCategory }),
    ];
    const { container } = render(<CollapsedSideNav {...defaultProps} navLinks={navLinks} />);
    expect(container.querySelector('.obsCollapsedNav-clusterGap')).toBeInTheDocument();
  });

  it('hides collapsible categories without icon', () => {
    const categoryWithoutIcon = {
      id: 'noIconCategory',
      label: 'Hidden Category',
      collapsible: true,
    };
    const navLinks = [
      makeLink({
        id: 'item1',
        title: 'Item 1',
        euiIconType: 'apps',
        category: categoryWithoutIcon,
      }),
    ];
    const { queryByText } = render(<CollapsedSideNav {...defaultProps} navLinks={navLinks} />);
    expect(queryByText('Hidden Category')).toBeNull();
  });

  it('renders collapsible categories with icon as popover trigger', () => {
    const category = {
      ...DEFAULT_APP_CATEGORIES.observabilityTools,
      collapsible: true,
      euiIconType: 'wrench' as const,
    };
    const navLinks = [
      makeLink({ id: 'tool1', title: 'Tool 1', category }),
      makeLink({ id: 'tool2', title: 'Tool 2', category }),
    ];
    const { getByTestId } = render(<CollapsedSideNav {...defaultProps} navLinks={navLinks} />);
    expect(getByTestId(`obsCollapsedIcon-${category.label}`)).toBeInTheDocument();
  });

  describe('hover popover', () => {
    it('shows the registered flyout content on hover', () => {
      const navLinks = [
        makeLink({
          id: 'dashboards',
          title: 'Dashboards',
          euiIconType: 'dashboardApp',
          navPopover: { render: () => <div data-test-subj="customPopover">Recent dashboards</div> },
        }),
      ];
      const { getByTestId, queryByTestId } = render(
        <CollapsedSideNav
          {...defaultProps}
          navLinks={navLinks}
          popoverServices={makePopoverServices()}
        />
      );

      expect(queryByTestId('customPopover')).not.toBeInTheDocument();
      fireEvent.mouseEnter(getByTestId('obsCollapsedIcon-dashboards').parentElement!);
      expect(getByTestId('customPopover')).toBeInTheDocument();
    });

    it('still navigates on direct click when a flyout is registered', () => {
      const navigateToApp = jest.fn();
      const navLinks = [
        makeLink({
          id: 'dashboards',
          title: 'Dashboards',
          euiIconType: 'dashboardApp',
          navPopover: { render: () => <div>content</div> },
        }),
      ];
      const { getByTestId } = render(
        <CollapsedSideNav
          {...defaultProps}
          navLinks={navLinks}
          navigateToApp={navigateToApp}
          popoverServices={makePopoverServices()}
        />
      );
      fireEvent.click(getByTestId('obsCollapsedIcon-dashboards'));
      expect(navigateToApp).toHaveBeenCalledWith('dashboards');
    });

    it('shows a title-only popover on hover when no navPopover is registered', () => {
      const navLinks = [makeLink({ id: 'logs', title: 'Logs', euiIconType: 'logsApp' })];
      const { getByTestId, queryByText } = render(
        <CollapsedSideNav
          {...defaultProps}
          navLinks={navLinks}
          popoverServices={makePopoverServices()}
        />
      );
      // Not shown until hovered.
      expect(queryByText('Logs')).not.toBeInTheDocument();
      // Every collapsed icon opens a popover on hover; with no registered actions
      // it shows just the title (consistent styling, tooltip-like).
      fireEvent.mouseEnter(getByTestId('obsCollapsedIcon-logs').parentElement!);
      expect(getByTestId('obsNavPopover')).toBeInTheDocument();
      expect(queryByText('Logs')).toBeInTheDocument();
    });
  });

  describe('actionsAsChildren (leaf actions inside a category popover)', () => {
    const wrenchCategory = {
      ...DEFAULT_APP_CATEGORIES.observabilityTools,
      collapsible: true,
      euiIconType: 'wrench' as const,
    };

    it('surfaces a leaf link navPopover actions as cascade child rows', () => {
      const onClick = jest.fn();
      const navLinks = [
        makeLink({
          id: 'notebooks',
          title: 'Notebooks',
          euiIconType: 'notebookApp',
          category: wrenchCategory,
          navPopover: {
            actions: [
              { id: 'create', label: 'Create notebook', onClick },
              { id: 'viewAll', label: 'View all', onClick },
            ],
          },
        }),
      ];
      const services = makePopoverServices();
      const { getByTestId } = render(
        <CollapsedSideNav {...defaultProps} navLinks={navLinks} popoverServices={services} />
      );
      // Open the category popover.
      fireEvent.mouseEnter(getByTestId(`obsCollapsedIcon-${wrenchCategory.label}`).parentElement!);
      // The leaf (Notebooks) is rendered as a parent row whose cascade children are
      // its actions, keyed `${leafId}-${actionId}`.
      const parentRow = getByTestId('obsNavPopoverItem-notebooks');
      expect(parentRow).toBeInTheDocument();
      // Open the secondary cascading popover to reveal the action rows.
      fireEvent.mouseEnter(parentRow.parentElement!);
      const createRow = getByTestId('obsNavPopoverItem-notebooks-create');
      expect(createRow).toBeInTheDocument();
      expect(getByTestId('obsNavPopoverItem-notebooks-viewAll')).toBeInTheDocument();
      // Clicking an action row runs its onClick with the popover services.
      fireEvent.click(createRow);
      expect(onClick).toHaveBeenCalledWith(services);
    });

    it('does not surface a cascade arrow when popoverServices is undefined (graceful degrade)', () => {
      const navLinks = [
        makeLink({
          id: 'notebooks',
          title: 'Notebooks',
          euiIconType: 'notebookApp',
          category: wrenchCategory,
          navPopover: {
            actions: [{ id: 'create', label: 'Create notebook', onClick: jest.fn() }],
          },
        }),
      ];
      // No popoverServices passed.
      const { getByTestId, queryByTestId } = render(
        <CollapsedSideNav {...defaultProps} navLinks={navLinks} />
      );
      fireEvent.mouseEnter(getByTestId(`obsCollapsedIcon-${wrenchCategory.label}`).parentElement!);
      const parentRow = getByTestId('obsNavPopoverItem-notebooks');
      // Attempting to open a (non-existent) secondary popover yields no action children.
      fireEvent.mouseEnter(parentRow.parentElement!);
      expect(queryByTestId('obsNavPopoverItem-notebooks-create')).not.toBeInTheDocument();
      // The leaf is just a plain navigable row; clicking navigates rather than cascading.
      expect(queryByTestId('obsNavPopover-sub-notebooks')).not.toBeInTheDocument();
    });
  });

  describe('buildPopoverTitle (sentence-cased category-prefixed title)', () => {
    it('prefixes a leaf title with its category in sentence case', () => {
      // Non-collapsible category: each child gets its own icon, and the popover
      // title is the category-prefixed phrase in sentence case.
      const agentMonitoring = { id: 'agentMonitoring', label: 'Agent Monitoring' };
      const navLinks = [
        makeLink({
          id: 'traces',
          title: 'Traces',
          euiIconType: 'apmTrace',
          category: agentMonitoring,
        }),
      ];
      const { getByTestId, getByText } = render(
        <CollapsedSideNav
          {...defaultProps}
          navLinks={navLinks}
          popoverServices={makePopoverServices()}
        />
      );
      fireEvent.mouseEnter(getByTestId('obsCollapsedIcon-traces').parentElement!);
      // "Agent Monitoring" + "Traces" -> "Agent monitoring traces"
      expect(getByText('Agent monitoring traces')).toBeInTheDocument();
    });

    it('leaves the title unchanged when there is no category', () => {
      const navLinks = [makeLink({ id: 'logs', title: 'Logs', euiIconType: 'logsApp' })];
      const { getByTestId, getByText } = render(
        <CollapsedSideNav
          {...defaultProps}
          navLinks={navLinks}
          popoverServices={makePopoverServices()}
        />
      );
      fireEvent.mouseEnter(getByTestId('obsCollapsedIcon-logs').parentElement!);
      expect(getByText('Logs')).toBeInTheDocument();
    });
  });
});
