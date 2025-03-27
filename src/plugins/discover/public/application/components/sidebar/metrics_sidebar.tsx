/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiText,
  EuiDragDropContext,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSplitPanel,
  EuiIcon,
  EuiPopover,
  EuiSelectable,
  EuiToolTip,
  EuiSmallButton,
  EuiDroppable,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { I18nProvider } from '@osd/i18n/react';
import React, { useState, useCallback } from 'react';
import { usePrometheus, PrometheusContext } from '../../view_components/utils/use_prometheus';
import { FieldIcon } from '../../../../../opensearch_dashboards_react/public';
import './discover_sidebar.scss';

export const MetricsSidebar = () => {
  const prometheusContext = usePrometheus();

  return (
    <I18nProvider>
      <EuiDragDropContext onDragEnd={() => {}}>
        <EuiSplitPanel.Outer
          className="sidebar-list eui-yScroll"
          aria-label={i18n.translate(
            'discover.fieldChooser.filter.indexAndFieldsSectionAriaLabel',
            {
              defaultMessage: 'Index and fields',
            }
          )}
          borderRadius="none"
          color="transparent"
          hasBorder={false}
        >
          <EuiSplitPanel.Inner grow={false} paddingSize="s" className="dscSideBar_searchContainer">
            <MetricsSelector prometheusContext={prometheusContext} />
          </EuiSplitPanel.Inner>
          <EuiSplitPanel.Inner className="eui-yScroll" paddingSize="none">
            <EuiDroppable droppableId="PROMETHEUS_LABELS" spacing="l">
              <>
                {prometheusContext.metadata.labelNames.length > 0 && (
                  <>
                    {prometheusContext.metadata.labelNames.map((label) => (
                      <EuiFlexGroup
                        gutterSize="s"
                        alignItems="center"
                        responsive={false}
                        className="dscSidebarField"
                        data-test-subj="dscSidebarField"
                      >
                        <EuiFlexItem grow={false}>
                          <FieldIcon type="string" />
                        </EuiFlexItem>
                        <EuiFlexItem grow>
                          <EuiText size="xs">{label}</EuiText>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    ))}
                  </>
                )}
              </>
            </EuiDroppable>
          </EuiSplitPanel.Inner>
        </EuiSplitPanel.Outer>
      </EuiDragDropContext>
    </I18nProvider>
  );
};

interface MetricsSelectorProps {
  prometheusContext: PrometheusContext;
}

interface MetricOption {
  label: string;
  checked?: 'on' | 'off';
}

const MetricsSelector = ({ prometheusContext }: MetricsSelectorProps) => {
  const {
    metadata: { selectedMetricName, metricNames },
  } = prometheusContext;

  const selectedMetricLabel = selectedMetricName ?? 'Select Metric';
  const metricOptions = metricNames.map((metricName): MetricOption => ({ label: metricName }));
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const togglePopover = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const closePopover = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleOptionChange = (options: MetricOption[]) => {
    const selectedOption = options.find((option) => option.checked === 'on');
    if (selectedOption) {
      prometheusContext.actions.setSelectedMetricName(selectedOption.label);
    }
    closePopover();
  };

  return (
    <EuiPopover
      button={
        <EuiToolTip display="block" content={selectedMetricLabel}>
          <EuiSmallButton
            className="datasetSelector__button"
            data-test-subj="datasetSelectorButton"
            iconType="arrowDown"
            iconSide="right"
            fullWidth
            onClick={togglePopover}
          >
            <EuiIcon
              type={'text'}
              className="datasetSelector__icon"
              data-test-subj="datasetSelectorIcon"
            />
            {selectedMetricLabel}
          </EuiSmallButton>
        </EuiToolTip>
      }
      isOpen={isOpen}
      closePopover={closePopover}
      anchorPosition="downLeft"
      display="block"
      panelPaddingSize="none"
    >
      <EuiSelectable
        className="datasetSelector__selectable"
        data-test-subj="datasetSelectorSelectable"
        options={metricOptions}
        singleSelection="always"
        searchable={true}
        onChange={handleOptionChange}
        listProps={{
          showIcons: false,
        }}
        searchProps={{
          compressed: true,
        }}
      >
        {(list, search) => (
          <>
            {search}
            {list}
          </>
        )}
      </EuiSelectable>
    </EuiPopover>
  );
};
