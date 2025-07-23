/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { EuiButtonGroup, EuiFlexItem, EuiIcon, EuiSplitPanel, EuiText } from '@elastic/eui';
import { DiscoverChartToggleId } from '../utils/use_persist_chart_state';

import './toggle_button_group.scss';

interface ToggleButtonGroupProps {
  isSummaryAvailable: boolean;
  toggleIdSelected: DiscoverChartToggleId;
  onToggleChange: (optionId: DiscoverChartToggleId) => void;
}

export const ToggleButtonGroup: React.FC<ToggleButtonGroupProps> = ({
  isSummaryAvailable,
  toggleIdSelected,
  onToggleChange,
}) => {
  if (!isSummaryAvailable) {
    return null;
  }

  const toggleButtons = [
    {
      id: 'histogram',
      label: (
        <>
          <EuiIcon
            type="visBarVertical"
            style={{ marginInlineEnd: 4, transform: 'translateY(-2px)' }}
          />
          {i18n.translate('explore.discover.timechartHeaderToggle.histogram', {
            defaultMessage: 'Histogram',
          })}
        </>
      ),
    },
    {
      id: 'summary',
      label: (
        <>
          <EuiIcon type="generate" style={{ marginInlineEnd: 4, transform: 'translateY(-1px)' }} />
          {i18n.translate('explore.discover.timechartHeaderToggle.summary', {
            defaultMessage: 'AI Summary',
          })}
        </>
      ),
    },
  ];

  return (
    <EuiFlexItem grow={false}>
      <EuiSplitPanel.Outer
        grow={false}
        direction="row"
        hasShadow={false}
        style={{ borderRadius: 2 }}
      >
        <EuiSplitPanel.Inner
          color="subdued"
          paddingSize="none"
          style={{ paddingInline: 8, alignContent: 'center' }}
        >
          <EuiText style={{ fontWeight: 600 }} size="s">
            {i18n.translate('explore.discover.timechartHeaderToggle.viewAs', {
              defaultMessage: 'View as',
            })}
          </EuiText>
        </EuiSplitPanel.Inner>
        <EuiSplitPanel.Inner paddingSize="none">
          <EuiButtonGroup
            className="exploreChartToggleButtonGroup"
            buttonSize="compressed"
            legend="This is a basic group"
            options={toggleButtons}
            idSelected={toggleIdSelected}
            onChange={(id) => onToggleChange(id as DiscoverChartToggleId)}
          />
        </EuiSplitPanel.Inner>
      </EuiSplitPanel.Outer>
    </EuiFlexItem>
  );
};
