/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiText } from '@elastic/eui';
import { FieldStatsItem } from './field_stats_types';

interface FieldStatsRowDetailsProps {
  field?: FieldStatsItem;
  details: any;
}

export const FieldStatsRowDetails: React.FC<FieldStatsRowDetailsProps> = ({ field }) => {
  return (
    <div data-test-subj="fieldStatsRowDetails">
      <EuiText size="s">Details for {field?.name} will be shown here</EuiText>
    </div>
  );
};
