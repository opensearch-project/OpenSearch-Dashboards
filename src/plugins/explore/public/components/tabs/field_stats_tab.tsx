/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FieldStatsContainer } from '../field_stats/field_stats_container';

export const FieldStatsTab = () => {
  return (
    <div className="explore-field-stats-tab tab-container" data-test-subj="fieldStatsTab">
      <FieldStatsContainer data-test-subj="fieldStatsTabContainer" />
    </div>
  );
};
