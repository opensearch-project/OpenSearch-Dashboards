/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { t } from '../../shared/i18n/t';
import { AlarmIcon, AlarmRecoveredIcon } from '../../shared/resources';
import './SliStatusIcon.scss';
import type { SliStatusIconProps } from './types';

export const SLI_STATUS_ICON_TEST_ID = (status: string) => `sli-status-icon-${status}`;

export const SliStatusIcon: React.FC<SliStatusIconProps> = ({
  status,
  size,
  isPulsing = false,
}) => (
  <div
    data-test-subj={SLI_STATUS_ICON_TEST_ID(status)}
    className={`celSliStatusIcon cel${status.charAt(0).toUpperCase() + status.slice(1)} ${
      isPulsing ? 'celAnimated' : ''
    }`}
    style={{
      width: `${size}px`,
      height: `${size}px`,
    }}
    role="img"
    aria-label={t(`sliStatus`)}
  >
    <img
      src={status === 'recovered' ? AlarmRecoveredIcon : AlarmIcon}
      height={size}
      width={size}
      alt=""
    />
  </div>
);
