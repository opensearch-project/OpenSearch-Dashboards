/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import type { PropsWithChildren } from 'react';
import type { DonutProps } from './types';
import './styles.scss';
import { DonutSegments } from './components/DonutSegments';

export const DONUT_TEST_ID = 'donut';
export const DONUT_ICON_TEST_ID = 'donut-icon';
export const DONUT_TORUS_TEST_ID = 'donut-torus';

export const Donut: React.FC<PropsWithChildren<DonutProps>> = ({
  segments,
  iconSize,
  diameter,
  fill,
  stroke,
  isInverted,
  children,
}) => (
  <div
    data-test-subj={DONUT_TEST_ID}
    className="celDonut"
    style={{ width: diameter, height: diameter }}
  >
    <svg
      data-test-subj={DONUT_TORUS_TEST_ID}
      width={diameter}
      height={diameter}
      viewBox={`0 0 ${diameter} ${diameter}`}
    >
      <DonutSegments diameter={diameter} segments={segments} fill={fill} stroke={stroke} />
    </svg>
    {children && (
      <div
        data-test-subj={DONUT_ICON_TEST_ID}
        className={`celDonutIcon ${isInverted ? 'celDonutInverted' : ''}`}
        style={{
          width: iconSize,
          height: iconSize,
        }}
      >
        {children}
      </div>
    )}
  </div>
);
