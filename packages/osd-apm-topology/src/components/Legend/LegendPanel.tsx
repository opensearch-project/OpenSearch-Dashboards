/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { useRef } from 'react';
import { t } from '../../shared/i18n/t';
import { useOnClickOutside } from '../../shared/hooks/use-on-click-outside.hook';
import { CloseIcon } from '../../shared/resources';
import { ErrorsLabel, RecoveredLabel, BreachedLabel, FaultsLabel, OkLabel } from '../Labels';
import { HealthDonut } from '../HealthDonut';
import { LegendPanelProps } from './types';

export const LegendPanel: React.FC<LegendPanelProps> = ({ onClose, showSliSlo = false }) => {
  const legendRef = useRef<HTMLDivElement>(null);

  // closes menu if user clicks outside of the node
  useOnClickOutside(legendRef, onClose);

  return (
    <div
      ref={legendRef}
      className="osd:w-58 osd:h-80 osd:bg-container-default osd:rounded-xl osd:shadow-xl osd:z-50 osd:overflow-auto"
    >
      <div className="osd:p-4 osd:grid osd:gap-3 osd:text-body-secondary">
        <div className="osd:flex osd:justify-between osd:items-center">
          <h3 className="osd:font-bold osd:text-sm">{t('legend.title')}</h3>
          <button onClick={onClose} className="osd:hover:text-interactive osd:cursor-pointer">
            <img src={CloseIcon} className="celIcon" alt="" />
          </button>
        </div>
        <div className="osd:flex osd:justify-center osd:items-center osd:py-2">
          <HealthDonut metrics={{ requests: 100, faults5xx: 35, errors4xx: 25 }} size={60} />
        </div>
        <ul className="osd:grid osd:gap-2">
          <li>
            <FaultsLabel text={t('legend.faults')} />
          </li>
          <li>
            <ErrorsLabel text={t('legend.errors')} />
          </li>
          <li>
            <OkLabel text={t('legend.ok')} />
          </li>
        </ul>
        {showSliSlo && (
          <ul className="osd:grid osd:gap-0.5 osd:-ml-0.5">
            <li>
              <BreachedLabel text={t('legend.activeSLIBreach')} />
            </li>
            <li>
              <RecoveredLabel text={t('legend.recoveredSLI')} />
            </li>
          </ul>
        )}
      </div>
    </div>
  );
};
