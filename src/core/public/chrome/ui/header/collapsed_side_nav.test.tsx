/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, fireEvent } from '@testing-library/react';
import { CollapsedSideNav, CollapsedSideNavProps } from './collapsed_side_nav';
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

  it('highlights active link with primary color', () => {
    const navLinks = [
      makeLink({ id: 'logs', title: 'Logs', euiIconType: 'logsApp' }),
      makeLink({ id: 'metrics', title: 'Metrics', euiIconType: 'metricsApp' }),
    ];
    const { getByTestId } = render(
      <CollapsedSideNav {...defaultProps} navLinks={navLinks} appId="logs" />
    );
    const activeButton = getByTestId('obsCollapsedIcon-logs');
    expect(activeButton.classList.toString()).toContain('primary');
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
});
