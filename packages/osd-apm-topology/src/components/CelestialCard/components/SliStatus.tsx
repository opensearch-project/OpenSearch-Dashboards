/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { t, TId } from '../../../shared/i18n/t';
import { Label } from '../../Labels/Label';
import { SliStatusIcon } from '../../SliStatusIcon';

export interface SliStatusProps {
  status: string;
}
export const SliStatus = ({ status }: SliStatusProps) => {
  const isBreached = status === 'breached';
  return (
    <Label
      text={t(`node.sliStatus.${status}` as TId)}
      className={`osd:gap-0.5 ${isBreached ? 'osd:text-faults' : 'osd:text-errors'}`}
    >
      <SliStatusIcon status={status} size={16} />
    </Label>
  );
};
