/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiLoadingSpinner, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { TagListProps } from '../../../../../saved_object_tags/public';

interface DashboardTagListTooltipProps {
  TagList: React.ComponentType<TagListProps>;
  target: TagListProps['target'];
  refreshKey: number;
}

const tooltipContentStyle: React.CSSProperties = {
  minWidth: 36,
  minHeight: 24,
  paddingTop: 4,
  display: 'flex',
  alignItems: 'center',
};

const centeredContentStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
};

export const DashboardTagListTooltip = ({
  TagList,
  target,
  refreshKey,
}: DashboardTagListTooltipProps) => (
  <div data-test-subj="dashboardTagListTooltip" style={tooltipContentStyle}>
    <TagList
      target={target}
      refreshKey={refreshKey}
      loadingContent={
        <div data-test-subj="dashboardTagListTooltipLoading" style={centeredContentStyle}>
          <EuiLoadingSpinner size="m" />
        </div>
      }
      emptyContent={
        <div data-test-subj="dashboardTagListTooltipEmpty" style={centeredContentStyle}>
          <EuiText size="xs">
            {i18n.translate('dashboard.topNav.tagsTooltip.emptyMessage', {
              defaultMessage: 'No tags',
            })}
          </EuiText>
        </div>
      }
    />
  </div>
);
