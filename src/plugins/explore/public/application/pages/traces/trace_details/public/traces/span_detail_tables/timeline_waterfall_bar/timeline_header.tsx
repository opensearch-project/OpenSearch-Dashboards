/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { TimelineRuler, TimelineRulerProps } from './timeline_ruler';

export type TimelineHeaderProps = TimelineRulerProps;

export const TimelineHeader: React.FC<TimelineHeaderProps> = (props) => {
  return (
    <EuiFlexGroup direction="column" gutterSize="xs">
      <EuiFlexItem grow={false}>
        <EuiText size="xs">
          <b>
            {i18n.translate('explore.spanDetailTable.column.timeline', {
              defaultMessage: 'Timeline',
            })}
          </b>
        </EuiText>
      </EuiFlexItem>
      <TimelineRuler {...props} />
    </EuiFlexGroup>
  );
};
