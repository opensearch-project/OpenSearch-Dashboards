/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';
import { i18n } from '@osd/i18n';
import {
  EuiTabbedContent,
  EuiTabbedContentTab,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiRange,
  EuiFieldText,
  EuiSpacer,
  EuiSwitch,
} from '@elastic/eui';
import { MetricChartStyleControls } from './metric_vis_config';
import { VisColumn, RangeValue } from '../types';
import { CustomRange } from '../style_panel/custom_ranges';
import { useStyleControls } from '../utils/use_style_control';

export interface MetricVisStyleControlsProps {
  styleOptions: MetricChartStyleControls;
  onStyleChange: (newOptions: Partial<MetricChartStyleControls>) => void;
  numericalColumns?: DiscoverVisColumn[];
  categoricalColumns?: DiscoverVisColumn[];
  dateColumns?: DiscoverVisColumn[];
}

export const MetricVisStyleControls: React.FC<MetricVisStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
}) => {
  const updateStyleOption = <K extends keyof MetricChartStyleControls>(
    key: K,
    value: MetricChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };
  const tabs: EuiTabbedContentTab[] = [
    {
      id: 'exclusive',
      name: i18n.translate('explore.vis.metricChart.tabs.exclusive', {
        defaultMessage: 'Exclusive',
      }),
      content: (
        <>
          <EuiSpacer />
          <EuiFlexGroup direction="column" alignItems="flexStart" gutterSize="m">
            <EuiFlexItem>
              {/* <SwitchOption
                label="Show Titles"
                paramName="showTitle"
                value={styleOptions.showTitle}
                setValue={(_, val) => updateStyleOption('showTitle', val)}
              /> */}
            </EuiFlexItem>
            {styleOptions.showTitle && (
              <EuiFlexItem>
                <EuiFlexGroup
                  alignItems="flexStart"
                  direction="column"
                  justifyContent="center"
                  gutterSize="none"
                >
                  <EuiFlexItem grow={false}>
                    <EuiText size="s">Title</EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiFieldText
                      compressed
                      placeholder="metric title"
                      value={styleOptions.title}
                      onChange={(e) => updateStyleOption('title', e.target.value)}
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            )}
            <EuiFlexItem>
              <EuiFlexGroup
                alignItems="flexStart"
                direction="column"
                justifyContent="center"
                gutterSize="none"
              >
                <EuiFlexItem>
                  <EuiText size="s">Font Size</EuiText>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiRange
                    max={100}
                    value={styleOptions.fontSize}
                    onChange={(e) => updateStyleOption('fontSize', Number(e.currentTarget.value))}
                    showInput
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiSwitch
                label="Use color for font color"
                checked={styleOptions.useColor}
                onChange={(e) => updateStyleOption('useColor', e.target.checked)}
              />
            </EuiFlexItem>
            {styleOptions.useColor && (
              <EuiFlexItem>
                <CustomRange
                  customRanges={styleOptions.customRanges}
                  onCustomRangesChange={(ranges: RangeValue[]) => {
                    updateStyleOption('customRanges', ranges);
                  }}
                />
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </>
      ),
    },
  ];

  return (
    <EuiTabbedContent
      tabs={tabs}
      initialSelectedTab={tabs[0]}
      autoFocus="selected"
      size="s"
      expand={false}
    />
  );
};
