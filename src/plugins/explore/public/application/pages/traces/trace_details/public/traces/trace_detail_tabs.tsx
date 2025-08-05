/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiTabs,
  EuiTab,
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiButtonEmpty,
  EuiToolTip,
} from '@elastic/eui';

export interface TraceDetailTabsProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  transformedHits: any[];
  errorCount: number;
  spanFilters: any[];
  handleErrorFilterClick: () => void;
  servicesInOrder: string[];
  setIsServiceLegendOpen: (isOpen: boolean) => void;
  isServiceLegendOpen: boolean;
}

export const TraceDetailTabs: React.FC<TraceDetailTabsProps> = ({
  activeTab,
  setActiveTab,
  transformedHits,
  errorCount,
  spanFilters,
  handleErrorFilterClick,
  servicesInOrder,
  setIsServiceLegendOpen,
  isServiceLegendOpen,
}) => {
  return (
    <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
      <EuiFlexItem>
        <EuiTabs>
          {[
            {
              id: 'timeline',
              name: i18n.translate('explore.traceView.tab.timeline', {
                defaultMessage: 'Timeline',
              }),
            },
            {
              id: 'span_list',
              name: (
                <>
                  {transformedHits.length > 0 && (
                    <>
                      <EuiBadge color="default">{transformedHits.length}</EuiBadge>{' '}
                    </>
                  )}
                  {i18n.translate('explore.traceView.tab.spanList', {
                    defaultMessage: 'Span list',
                  })}
                </>
              ),
            },
            {
              id: 'tree_view',
              name: i18n.translate('explore.traceView.tab.treeView', {
                defaultMessage: 'Tree view',
              }),
            },
            {
              id: 'service_map',
              name: i18n.translate('explore.traceView.tab.serviceMap', {
                defaultMessage: 'Service map',
              }),
            },
          ].map((tab) => (
            <EuiTab
              key={tab.id}
              isSelected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.name}
            </EuiTab>
          ))}
        </EuiTabs>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiFlexGroup gutterSize="s" alignItems="center">
          {errorCount > 0 &&
            !spanFilters.some((filter) => filter.field === 'status.code' && filter.value === 2) && (
              <EuiFlexItem grow={false}>
                <EuiToolTip
                  content={i18n.translate('explore.traceView.tooltip.clickToApplyFilter', {
                    defaultMessage: 'Click to apply filter',
                  })}
                >
                  <EuiButton
                    onClick={handleErrorFilterClick}
                    data-test-subj="error-count-button"
                    size="s"
                    color="secondary"
                  >
                    {i18n.translate('explore.traceView.button.filterErrors', {
                      defaultMessage: 'Filter errors ({errorCount})',
                      values: { errorCount },
                    })}
                  </EuiButton>
                </EuiToolTip>
              </EuiFlexItem>
            )}
          {servicesInOrder.length > 0 && (
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                size="s"
                onClick={() => setIsServiceLegendOpen(!isServiceLegendOpen)}
                iconType="inspect"
                data-test-subj="service-legend-toggle"
                isSelected={isServiceLegendOpen}
              >
                {i18n.translate('explore.traceView.button.serviceLegend', {
                  defaultMessage: 'Service legend',
                })}
              </EuiButtonEmpty>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
