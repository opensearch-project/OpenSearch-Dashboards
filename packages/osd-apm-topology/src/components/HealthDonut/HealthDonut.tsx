/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { useElementHover } from '../../shared/hooks/use-element-hover.hook';
import { HealthDonutProps } from './types';
import { useDonutSegments } from './hooks/use-donut-segments.hook';
import { useIconSizing } from './hooks/use-icon-sizing.hook';
import { SliStatusIcon } from '../SliStatusIcon/SliStatusIcon';
import './styles.scss';
import { useHealthStatusColors } from './hooks/use-health-status-colors.hook';
import { AbsolutePosition } from './components/AbsolutePosition';
import { Donut } from '../Donut';
import { HEALTH_DONUT_STATUS } from './constants';
import { Legend } from './components/Legend';

export const HEALTH_DONUT_TEST_ID = 'health-donut';

export const HealthDonut: React.FC<HealthDonutProps> = ({
  metrics,
  health,
  size,
  icon,
  status,
  isLegendEnabled,
  children,
}) => {
  const { isHovered: isVisible, ...rest } = useElementHover();

  const iconSizes = useIconSizing(size);
  const segments = useDonutSegments(metrics);
  const colors = useHealthStatusColors(status);

  return (
    <div
      data-test-subj={HEALTH_DONUT_TEST_ID}
      className="celHealthDonut"
      style={{ width: size, height: size }}
      {...(isLegendEnabled ? rest : {})}
    >
      {(health?.status === 'breached' || health?.status === 'recovered') && (
        <AbsolutePosition left="-8%" top="-8%">
          <SliStatusIcon
            status={health.status}
            size={iconSizes.sliStatusIconSize}
            isPulsing={true}
          />
        </AbsolutePosition>
      )}
      <Donut
        diameter={size}
        iconSize={iconSizes.centerIconSize}
        segments={segments}
        isInverted={status !== undefined && status !== HEALTH_DONUT_STATUS.OK}
        fill={colors.fill}
        stroke={colors.stroke}
      >
        {icon}
      </Donut>
      {isLegendEnabled && isVisible && <Legend metrics={metrics} health={health} />}
      {children}
    </div>
  );
};
