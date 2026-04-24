/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, fireEvent } from '@testing-library/react';
import { ExpandedSideNav, ExpandedSideNavProps } from './expanded_side_nav';
import { ChromeNavLink } from '../../nav_links';
import { ChromeRegistrationNavLink } from '../../nav_group';
import { httpServiceMock } from '../../../mocks';
import { DEFAULT_APP_CATEGORIES } from '../../../../../core/utils';

const mockBasePath = httpServiceMock.createSetupContract({ basePath: '/test' }).basePath;

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
    const { getByText } = render(<ExpandedSideNav {...defaultProps} navLinks={navLinks} />);
    expect(getByText(DEFAULT_APP_CATEGORIES.observabilityTools!.label)).toBeInTheDocument();
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
});
