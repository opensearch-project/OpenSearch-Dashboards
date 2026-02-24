/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { t } from '../../../../shared/i18n/t';
import './Legend.scss';
import {
  BreachedLabel,
  ErrorsLabel,
  FaultsLabel,
  Label,
  RecoveredLabel,
  OkLabel,
} from '../../../Labels';
import { useMetricPercentages } from '../../hooks/use-metric-percentages.hook';
import type { LegendProps } from './types';

export const Legend: React.FC<LegendProps> = ({ metrics, health, trianglePosition = 'left' }) => {
  const legendClassName = `celHealthDonutLegend ${
    trianglePosition === 'right' ? 'celTriangleRight' : 'celTriangleLeft'
  }`;

  const { faults5xxPercent, errors4xxPercent, ok2xxPercent } = useMetricPercentages(
    metrics ?? {
      requests: 0,
      faults5xx: 0,
      errors4xx: 0,
    }
  );

  const { breached, recovered } = health ?? {
    breached: 0,
    recovered: 0,
  };

  return (
    <div className={legendClassName}>
      <div className="celHealthDonutLegendContent">
        {!!faults5xxPercent && (
          <FaultsLabel
            text={t('healthDonut.legend.faults', { value: Math.round(faults5xxPercent) })}
          />
        )}
        {!!errors4xxPercent && (
          <ErrorsLabel
            text={t('healthDonut.legend.errors', { value: Math.round(errors4xxPercent) })}
          />
        )}
        {!!ok2xxPercent && (
          <OkLabel text={t('healthDonut.legend.ok', { value: Math.round(ok2xxPercent) })} />
        )}
        {!!breached && (
          <div className="osd:-ml-0.5 osd:-mt-0.5">
            <BreachedLabel text={t(`healthDonut.legend.sliBreach`, { value: breached })} />
          </div>
        )}
        {!!recovered && !breached && (
          <div className="osd:-ml-0.5 osd:-mt-0.5">
            <RecoveredLabel text={t(`healthDonut.legend.sliRecovered`, { value: recovered })} />
          </div>
        )}
        {!breached && !recovered && !faults5xxPercent && !errors4xxPercent && !ok2xxPercent && (
          <Label text={t(`healthDonut.legend.noIssue`)} />
        )}
      </div>
    </div>
  );
};
