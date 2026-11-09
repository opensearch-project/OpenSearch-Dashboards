/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { i18n } from '@osd/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiSelect, EuiSwitch, EuiToolTip } from '@elastic/eui';
import { useObservable } from 'react-use';
import { SaveVisButton } from './save_vis_button';
import { useVisualizationBuilder } from '../hooks/use_visualization_builder';
import { useMultiQueryBuilder } from '../multi_query_builder/multi_query_builder_context';
import { resolveRawTableRefId } from '../multi_query_builder/utils';

export const VisActionBar = () => {
  const { visualizationBuilderForEditor: visualizationBuilder } = useVisualizationBuilder();
  const visConfig = useObservable(visualizationBuilder.visConfig$);
  const showRawTable = useObservable(visualizationBuilder.showRawTable$);
  const rawTableRefId = useObservable(visualizationBuilder.rawTableRefId$);
  const container = useMultiQueryBuilder();
  // Visible rows with a result only
  const series$ = useMemo(() => container.getSeriesResult$(), [container]);
  const series = useObservable(series$, []);

  const hasSelectionMapping = Object.keys(visConfig?.axesMapping ?? {}).length !== 0;
  const isNonTableChart = !!visConfig?.type && visConfig.type !== 'table' && hasSelectionMapping;

  return (
    <EuiFlexGroup
      direction="row"
      gutterSize="none"
      justifyContent="spaceBetween"
      alignItems="center"
    >
      <EuiFlexItem>
        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiToolTip
              content={i18n.translate('explore.discover.showRawDataTooltip', {
                defaultMessage: 'View raw data table for this visualization',
              })}
            >
              <EuiSwitch
                label={i18n.translate('explore.discover.showRawData', {
                  defaultMessage: 'Show raw data',
                })}
                disabled={!isNonTableChart}
                checked={!!showRawTable}
                onChange={(e) => visualizationBuilder.setShowRawTable(e.target.checked)}
                data-test-subj="exploreShowRawDataSwitch"
              />
            </EuiToolTip>
          </EuiFlexItem>
          {/* Which query's result the raw table shows (not the merged data is the vis itself). */}
          {showRawTable && series.length > 1 && (
            <EuiFlexItem grow={false}>
              <EuiSelect
                compressed
                options={series.map((s) => ({
                  value: s.refId,
                  text: i18n.translate('explore.visEditor.rawTableQueryOption', {
                    defaultMessage: 'Query {refId}',
                    values: { refId: s.refId },
                  }),
                }))}
                value={resolveRawTableRefId(series, rawTableRefId)}
                onChange={(e) => visualizationBuilder.setRawTableRefId(e.target.value)}
                aria-label={i18n.translate('explore.visEditor.rawTableQueryAriaLabel', {
                  defaultMessage: 'Raw data select for each query',
                })}
                data-test-subj="exploreRawTableSelect"
              />
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiFlexItem>

      <EuiFlexItem>
        <SaveVisButton />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
