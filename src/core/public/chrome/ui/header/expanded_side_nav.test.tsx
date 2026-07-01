/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, fireEvent } from '@testing-library/react';
import { of } from 'rxjs';
import { ExpandedSideNav, ExpandedSideNavProps } from './expanded_side_nav';
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

describe('<ExpandedSideNav />', () => {
  const defaultProps: ExpandedSideNavProps = {
    navLinks: [],
    appId: '',
    navigateToApp: jest.fn(),
    basePath: mockBasePath,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state without errors', () => {
    const { getByTestId } = render(<ExpandedSideNav {...defaultProps} />);
    expect(getByTestId('obsExpandedNav')).toBeInTheDocument();
  });

  it('renders flat nav links', () => {
    const navLinks = [
      makeLink({ id: 'logs', title: 'Logs', euiIconType: 'logsApp' }),
      makeLink({ id: 'metrics', title: 'Metrics', euiIconType: 'metricsApp' }),
    ];
    const { getByTestId, getByText } = render(
      <ExpandedSideNav {...defaultProps} navLinks={navLinks} />
    );
    expect(getByTestId('obsNavItem-logs')).toBeInTheDocument();
    expect(getByTestId('obsNavItem-metrics')).toBeInTheDocument();
    expect(getByText('Logs')).toBeInTheDocument();
    expect(getByText('Metrics')).toBeInTheDocument();
  });

  it('marks active link', () => {
    const navLinks = [
      makeLink({ id: 'logs', title: 'Logs', euiIconType: 'logsApp' }),
      makeLink({ id: 'metrics', title: 'Metrics', euiIconType: 'metricsApp' }),
    ];
    const { getByTestId } = render(
      <ExpandedSideNav {...defaultProps} navLinks={navLinks} appId="logs" />
    );
    expect(getByTestId('obsNavItem-logs').getAttribute('data-active')).toBe('true');
    expect(getByTestId('obsNavItem-metrics').getAttribute('data-active')).toBeNull();
  });

  it('navigates on click', () => {
    const navigateToApp = jest.fn();
    const navLinks = [makeLink({ id: 'logs', title: 'Logs', euiIconType: 'logsApp' })];
    const { getByTestId } = render(
      <ExpandedSideNav {...defaultProps} navLinks={navLinks} navigateToApp={navigateToApp} />
    );
    fireEvent.click(getByTestId('obsNavItem-logs'));
    expect(navigateToApp).toHaveBeenCalledWith('logs');
  });

  it('renders categorized links with category label', () => {
    const navLinks = [
      makeLink({
        id: 'traces',
        title: 'Traces',
        euiIconType: 'apmTrace',
        category: DEFAULT_APP_CATEGORIES.observabilityTools,
      }),
      makeLink({
        id: 'spans',
        title: 'Spans',
        euiIconType: 'apmTrace',
        category: DEFAULT_APP_CATEGORIES.observabilityTools,
      }),
    ];
    const { getByText, getByTestId } = render(
      <ExpandedSideNav {...defaultProps} navLinks={navLinks} />
    );
    // The observabilityTools category was renamed "Tools" → "More".
    expect(DEFAULT_APP_CATEGORIES.observabilityTools!.label).toBe('More');
    expect(getByText('More')).toBeInTheDocument();
    expect(getByTestId('obsNavSection-More')).toBeInTheDocument();
  });

  it('renders cluster gap before categories', () => {
    const navLinks = [
      makeLink({ id: 'logs', title: 'Logs', euiIconType: 'logsApp' }),
      makeLink({
        id: 'traces',
        title: 'Traces',
        euiIconType: 'apmTrace',
        category: DEFAULT_APP_CATEGORIES.observabilityTools,
      }),
    ];
    const { container } = render(<ExpandedSideNav {...defaultProps} navLinks={navLinks} />);
    expect(container.querySelector('.obs-nav-cluster-gap')).toBeInTheDocument();
  });

  it('renders cluster gap before items with startCluster', () => {
    const navLinks = [
      makeLink({ id: 'logs', title: 'Logs', euiIconType: 'logsApp' }),
      makeLink({
        id: 'topology',
        title: 'Topology Map',
        euiIconType: 'graphApp',
        startCluster: true,
      }),
    ];
    const { container } = render(<ExpandedSideNav {...defaultProps} navLinks={navLinks} />);
    expect(container.querySelector('.obs-nav-cluster-gap')).toBeInTheDocument();
  });

  it('renders items without icon using no-icon class', () => {
    const navLinks = [makeLink({ id: 'noicon', title: 'No Icon' })];
    const { container } = render(<ExpandedSideNav {...defaultProps} navLinks={navLinks} />);
    expect(container.querySelector('.obs-nav-item-row--no-icon')).toBeInTheDocument();
  });

  describe('info tooltip', () => {
    it('renders a right-aligned info icon when infoTooltip is set', () => {
      const navLinks = [
        makeLink({
          id: 'alerting',
          title: 'Alerts',
          euiIconType: 'navAlerting',
          infoTooltip: 'New alerting hub — alerts, anomaly detection, and SLOs together.',
        }),
      ];
      const { container, getByLabelText } = render(
        <ExpandedSideNav {...defaultProps} navLinks={navLinks} />
      );
      expect(container.querySelector('.obs-nav-info')).toBeInTheDocument();
      // EuiIconTip exposes the content as the icon's aria-label.
      expect(
        getByLabelText('New alerting hub — alerts, anomaly detection, and SLOs together.')
      ).toBeInTheDocument();
    });

    it('does not render an info icon when infoTooltip is absent', () => {
      const navLinks = [makeLink({ id: 'logs', title: 'Logs', euiIconType: 'logsApp' })];
      const { container } = render(<ExpandedSideNav {...defaultProps} navLinks={navLinks} />);
      expect(container.querySelector('.obs-nav-info')).not.toBeInTheDocument();
    });
  });

  it('renders collapsible section for collapsible categories', () => {
    const collapsibleCategory = {
      id: 'tools',
      label: 'Tools',
      collapsible: true,
      euiIconType: 'wrench' as const,
    };
    const navLinks = [
      makeLink({
        id: 'tool1',
        title: 'Tool 1',
        euiIconType: 'wrench',
        category: collapsibleCategory,
      }),
      makeLink({
        id: 'tool2',
        title: 'Tool 2',
        euiIconType: 'gear',
        category: collapsibleCategory,
      }),
    ];
    const { getByTestId } = render(<ExpandedSideNav {...defaultProps} navLinks={navLinks} />);
    expect(getByTestId('obsNavSection-Tools')).toBeInTheDocument();
  });

  describe('collapsible category persistence', () => {
    const collapsibleCategory = {
      id: 'tools',
      label: 'Tools',
      collapsible: true,
      euiIconType: 'wrench' as const,
    };
    const navLinks = [
      makeLink({
        id: 'tool1',
        title: 'Tool 1',
        euiIconType: 'wrench',
        category: collapsibleCategory,
      }),
    ];

    const makeStorage = (initial: Record<string, string> = {}): Storage => {
      const store: Record<string, string> = { ...initial };
      return {
        getItem: (k: string) => (k in store ? store[k] : null),
        setItem: (k: string, v: string) => {
          store[k] = v;
        },
        removeItem: (k: string) => {
          delete store[k];
        },
        clear: () => undefined,
        key: () => null,
        length: 0,
      } as Storage;
    };

    it('writes open/closed state to storage on toggle (key core.navGroup.<id>)', () => {
      const storage = makeStorage();
      const setItem = jest.spyOn(storage, 'setItem');
      const { getByTestId } = render(
        <ExpandedSideNav {...defaultProps} navLinks={navLinks} storage={storage} />
      );
      fireEvent.click(getByTestId('obsNavSection-Tools'));
      expect(setItem).toHaveBeenCalledWith('core.navGroup.tools', expect.any(String));
    });

    it('honors a stored collapsed state on first render', () => {
      const storage = makeStorage({ 'core.navGroup.tools': 'false' });
      const { container } = render(
        <ExpandedSideNav {...defaultProps} navLinks={navLinks} storage={storage} />
      );
      // data-collapsed reflects the persisted "closed" state.
      expect(
        container.querySelector('.obs-nav-collapsible-wrapper')?.getAttribute('data-collapsed')
      ).toBe('true');
    });
  });

  it('prevents default on link click and calls navigateToApp', () => {
    const navigateToApp = jest.fn();
    const navLinks = [makeLink({ id: 'app1', title: 'App 1', euiIconType: 'apps' })];
    const { getByTestId } = render(
      <ExpandedSideNav {...defaultProps} navLinks={navLinks} navigateToApp={navigateToApp} />
    );
    const link = getByTestId('obsNavItem-app1');
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    Object.defineProperty(clickEvent, 'preventDefault', { value: jest.fn() });
    link.dispatchEvent(clickEvent);
    expect(navigateToApp).toHaveBeenCalledWith('app1');
  });

  describe('category label sentence-casing', () => {
    it('sentence-cases a multi-word Title Case category label', () => {
      const category = {
        id: 'agentMonitoring',
        label: 'Agent Monitoring',
      };
      const navLinks = [
        makeLink({
          id: 'agents',
          title: 'Agents',
          euiIconType: 'apps',
          category,
        }),
      ];
      const { getByText, queryByText } = render(
        <ExpandedSideNav {...defaultProps} navLinks={navLinks} />
      );
      expect(getByText('Agent monitoring')).toBeInTheDocument();
      // The original Title Case label should not be displayed.
      expect(queryByText('Agent Monitoring')).not.toBeInTheDocument();
    });

    it('leaves a single-word category label unchanged', () => {
      const category = {
        id: 'tools',
        label: 'Tools',
      };
      const navLinks = [
        makeLink({
          id: 'tool1',
          title: 'Tool 1',
          euiIconType: 'wrench',
          category,
        }),
      ];
      const { getByText } = render(<ExpandedSideNav {...defaultProps} navLinks={navLinks} />);
      expect(getByText('Tools')).toBeInTheDocument();
    });

    it('preserves all-caps acronym tokens in a category label', () => {
      const category = {
        id: 'apm',
        label: 'APM Services',
      };
      const navLinks = [makeLink({ id: 'svc', title: 'Service', euiIconType: 'apps', category })];
      const { getByText } = render(<ExpandedSideNav {...defaultProps} navLinks={navLinks} />);
      // "APM" stays upper-case; only the non-acronym word is lowercased.
      expect(getByText('APM services')).toBeInTheDocument();
    });

    it('sentence-cases collapsible category labels too', () => {
      const category = {
        id: 'agentMonitoring',
        label: 'Agent Monitoring',
        collapsible: true,
        euiIconType: 'apps' as const,
      };
      const navLinks = [
        makeLink({
          id: 'agents',
          title: 'Agents',
          euiIconType: 'apps',
          category,
        }),
      ];
      const { getByText, queryByText } = render(
        <ExpandedSideNav {...defaultProps} navLinks={navLinks} />
      );
      expect(getByText('Agent monitoring')).toBeInTheDocument();
      expect(queryByText('Agent Monitoring')).not.toBeInTheDocument();
    });

    it('does NOT sentence-case nav link row titles', () => {
      const category = {
        id: 'agentMonitoring',
        label: 'Agent Monitoring',
      };
      const navLinks = [
        makeLink({
          id: 'anomalyDetection',
          title: 'Anomaly Detection',
          euiIconType: 'apps',
          category,
        }),
      ];
      const { getByText, queryByText } = render(
        <ExpandedSideNav {...defaultProps} navLinks={navLinks} />
      );
      // Link row title keeps its original Title Case.
      expect(getByText('Anomaly Detection')).toBeInTheDocument();
      expect(queryByText('Anomaly detection')).not.toBeInTheDocument();
    });
  });

  describe('collapsible category alwaysUseDefaultOpen', () => {
    const makeStorage = (initial: Record<string, string> = {}): Storage => {
      const store: Record<string, string> = { ...initial };
      return {
        getItem: (k: string) => (k in store ? store[k] : null),
        setItem: (k: string, v: string) => {
          store[k] = v;
        },
        removeItem: (k: string) => {
          delete store[k];
        },
        clear: () => undefined,
        key: () => null,
        length: 0,
      } as Storage;
    };

    const makeCategory = (overrides = {}) => ({
      id: 'manageWorkspace',
      label: 'Manage Workspace',
      collapsible: true,
      euiIconType: 'gear' as const,
      defaultOpen: true,
      alwaysUseDefaultOpen: true,
      ...overrides,
    });

    it('ignores a stored collapsed state on first render (opens to default)', () => {
      const category = makeCategory();
      const navLinks = [
        makeLink({
          id: 'ws1',
          title: 'Workspace 1',
          euiIconType: 'gear',
          category,
        }),
      ];
      // Stored state says "closed" (false), but the flag forces the default (open).
      const storage = makeStorage({ 'core.navGroup.manageWorkspace': 'false' });
      const { container } = render(
        <ExpandedSideNav {...defaultProps} navLinks={navLinks} storage={storage} />
      );
      // defaultOpen=true -> default collapsed=false, stored state ignored.
      expect(
        container.querySelector('.obs-nav-collapsible-wrapper')?.getAttribute('data-collapsed')
      ).toBe('false');
    });

    it('does NOT persist to storage on toggle when alwaysUseDefaultOpen is true', () => {
      const category = makeCategory();
      const navLinks = [
        makeLink({
          id: 'ws1',
          title: 'Workspace 1',
          euiIconType: 'gear',
          category,
        }),
      ];
      const storage = makeStorage();
      const setItem = jest.spyOn(storage, 'setItem');
      const { getByTestId } = render(
        <ExpandedSideNav {...defaultProps} navLinks={navLinks} storage={storage} />
      );
      fireEvent.click(getByTestId('obsNavSection-Manage Workspace'));
      expect(setItem).not.toHaveBeenCalled();
    });

    it('still toggles within the session even though it does not persist', () => {
      const category = makeCategory();
      const navLinks = [
        makeLink({
          id: 'ws1',
          title: 'Workspace 1',
          euiIconType: 'gear',
          category,
        }),
      ];
      const storage = makeStorage();
      const { getByTestId, container } = render(
        <ExpandedSideNav {...defaultProps} navLinks={navLinks} storage={storage} />
      );
      // Starts open (defaultOpen=true).
      expect(
        container.querySelector('.obs-nav-collapsible-wrapper')?.getAttribute('data-collapsed')
      ).toBe('false');
      fireEvent.click(getByTestId('obsNavSection-Manage Workspace'));
      // Toggled closed in-session.
      expect(
        container.querySelector('.obs-nav-collapsible-wrapper')?.getAttribute('data-collapsed')
      ).toBe('true');
    });
  });

  describe('hover popover', () => {
    it('shows the registered content in a popover on hover', () => {
      const navLinks = [
        makeLink({
          id: 'dashboards',
          title: 'Dashboards',
          euiIconType: 'dashboardApp',
          navPopover: { render: () => <div data-test-subj="customPanel">Recent dashboards</div> },
        }),
      ];
      const { getByTestId, queryByTestId } = render(
        <ExpandedSideNav
          {...defaultProps}
          navLinks={navLinks}
          popoverServices={makePopoverServices()}
        />
      );
      // Not visible until hovered.
      expect(queryByTestId('customPanel')).not.toBeInTheDocument();
      fireEvent.mouseEnter(getByTestId('obsNavItem-dashboards').parentElement!);
      expect(getByTestId('customPanel')).toBeInTheDocument();
    });

    it('still navigates on direct row click', () => {
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
        <ExpandedSideNav
          {...defaultProps}
          navLinks={navLinks}
          navigateToApp={navigateToApp}
          popoverServices={makePopoverServices()}
        />
      );
      fireEvent.click(getByTestId('obsNavItem-dashboards'));
      expect(navigateToApp).toHaveBeenCalledWith('dashboards');
    });

    it('renders a plain link (no popover) when no navPopover is registered', () => {
      const navLinks = [makeLink({ id: 'logs', title: 'Logs', euiIconType: 'logsApp' })];
      const { getByTestId, queryByTestId } = render(
        <ExpandedSideNav
          {...defaultProps}
          navLinks={navLinks}
          popoverServices={makePopoverServices()}
        />
      );
      fireEvent.mouseEnter(getByTestId('obsNavItem-logs').parentElement!);
      expect(queryByTestId('obsNavPopover')).not.toBeInTheDocument();
    });
  });
});
