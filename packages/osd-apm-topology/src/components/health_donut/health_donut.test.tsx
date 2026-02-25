/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen } from '../../test_utils/vitest.utilities';
import { Ec2Icon } from '../../shared/resources/services';
import { HealthDonut, HEALTH_DONUT_TEST_ID } from './health_donut';
import { SLI_STATUS_ICON_TEST_ID } from '../sli_status_icon/sli_status_icon';
import { DONUT_ICON_TEST_ID, DONUT_TORUS_TEST_ID } from '../donut/donut';

describe('HealthDonut', () => {
  const mockMetrics = {
    requests: 1000,
    faults5xx: 400,
    errors4xx: 200,
  };

  const breachedHealth = {
    status: 'breached',
    breached: 1,
    total: 1,
    recovered: 0,
  };

  const recoveredHealth = {
    status: 'recovered',
    breached: 0,
    total: 1,
    recovered: 1,
  };

  test('renders base component with correct size', () => {
    render(<HealthDonut metrics={mockMetrics} size={40} />);

    const container = screen.getByTestId(HEALTH_DONUT_TEST_ID);
    expect(container).toBeInTheDocument();
    expect(container).toHaveStyle({ width: '40px', height: '40px' });
  });

  test('renders SVG with correct attributes', () => {
    render(<HealthDonut metrics={mockMetrics} size={40} />);

    const svg = screen.getByTestId(DONUT_TORUS_TEST_ID);
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '40');
    expect(svg).toHaveAttribute('height', '40');
    expect(svg).toHaveAttribute('viewBox', '0 0 40 40');
  });

  test('renders icon when provided', () => {
    const mockIcon = <div data-test-subj="mock-icon">Icon</div>;
    render(<HealthDonut metrics={mockMetrics} size={40} icon={mockIcon} />);

    const iconContainer = screen.getByTestId(DONUT_ICON_TEST_ID);
    expect(iconContainer).toBeInTheDocument();
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  test('does not render icon when not provided', () => {
    render(<HealthDonut metrics={mockMetrics} size={40} />);

    expect(screen.queryByTestId(DONUT_ICON_TEST_ID)).not.toBeInTheDocument();
  });

  test('renders breached SliStatus icon when health status is "breached"', () => {
    render(
      <HealthDonut
        metrics={mockMetrics}
        size={40}
        icon={<img src={Ec2Icon} alt="" />}
        health={breachedHealth}
      />
    );

    const sliStatusIcon = screen.getByTestId(SLI_STATUS_ICON_TEST_ID('breached'));
    expect(sliStatusIcon).toBeInTheDocument();
  });

  test('renders recovered SliStatus icon when health status is "recovered"', () => {
    render(
      <HealthDonut
        metrics={mockMetrics}
        size={40}
        icon={<img src={Ec2Icon} alt="" />}
        health={recoveredHealth}
      />
    );

    const sliStatusIcon = screen.getByTestId(SLI_STATUS_ICON_TEST_ID('recovered'));
    expect(sliStatusIcon).toBeInTheDocument();
  });

  test('does not render SliStatus icon when "sli" is not provided', () => {
    render(<HealthDonut metrics={mockMetrics} size={40} icon={<img src={Ec2Icon} alt="" />} />);

    expect(screen.queryByTestId(SLI_STATUS_ICON_TEST_ID('breached'))).not.toBeInTheDocument();
    expect(screen.queryByTestId(SLI_STATUS_ICON_TEST_ID('recovered'))).not.toBeInTheDocument();
  });

  test('applies correct styles to icon container', () => {
    render(<HealthDonut metrics={mockMetrics} size={40} icon={<img src={Ec2Icon} alt="" />} />);

    const iconContainer = screen.getByTestId(DONUT_ICON_TEST_ID);
    expect(iconContainer).toHaveStyle({
      width: '15.278641006239997px',
      height: '15.278641006239997px',
    });
  });
});
