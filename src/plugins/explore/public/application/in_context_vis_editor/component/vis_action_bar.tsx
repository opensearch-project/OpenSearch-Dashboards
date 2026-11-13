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
import { RAW_TABLE_FINAL, resolveRawTableRefId } from '../multi_query_builder/utils';
import type { RawTableStage } from '../../../components/visualizations/visualization_builder';

export const VisActionBar = () => {
  const { visualizationBuilderForEditor: visualizationBuilder } = useVisualizationBuilder();
  const visConfig = useObservable(visualizationBuilder.visConfig$);
  const showRawTable = useObservable(visualizationBuilder.showRawTable$);
  const rawTableRefId = useObservable(visualizationBuilder.rawTableRefId$);
  const rawTableStage = useObservable(visualizationBuilder.rawTableStage$, 'before');
  const container = useMultiQueryBuilder();
  // Visible rows with a result only
  const series$ = useMemo(() => container.getSeriesResult$(), [container]);
  const series = useObservable(series$, []);

  const hasSelectionMapping = Object.keys(visConfig?.axesMapping ?? {}).length !== 0;
  const isNonTableChart = !!visConfig?.type && visConfig.type !== 'table' && hasSelectionMapping;

  const selectedRefId = resolveRawTableRefId(series, rawTableRefId);
  const isFinal = selectedRefId === RAW_TABLE_FINAL;

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

          {/* Which data the raw table shows: Final (what the vis draws) or one query's. */}
          {showRawTable && series.length > 1 && (
            <EuiFlexItem grow={false}>
              <EuiSelect
                compressed
                options={[
                  {
                    value: RAW_TABLE_FINAL,
                    text: i18n.translate('explore.visEditor.rawTableFinalOption', {
                      defaultMessage: 'Final',
                    }),
                  },
                  ...series.map((s) => ({
                    value: s.refId,
                    text: i18n.translate('explore.visEditor.rawTableQueryOption', {
                      defaultMessage: 'Query {refId}',
                      values: { refId: s.refId },
                    }),
                  })),
                ]}
                value={selectedRefId}
                onChange={(e) => {
                  visualizationBuilder.setRawTableRefId(e.target.value);
                  visualizationBuilder.resetRawTableStage();
                }}
                aria-label={i18n.translate('explore.visEditor.rawTableQueryAriaLabel', {
                  defaultMessage: 'Raw data select for each query',
                })}
                data-test-subj="exploreRawTableSelect"
              />
            </EuiFlexItem>
          )}
          {/* A query's data before or after the transformations. */}
          {showRawTable && !isFinal && (
            <EuiFlexItem grow={false}>
              <EuiSelect
                compressed
                options={[
                  {
                    value: 'before',
                    text: i18n.translate('explore.visEditor.rawTableBeforeOption', {
                      defaultMessage: 'Before transformations',
                    }),
                  },
                  {
                    value: 'after',
                    text: i18n.translate('explore.visEditor.rawTableAfterOption', {
                      defaultMessage: 'After transformations',
                    }),
                  },
                ]}
                value={rawTableStage}
                onChange={(e) =>
                  visualizationBuilder.setRawTableStage(e.target.value as RawTableStage)
                }
                aria-label={i18n.translate('explore.visEditor.rawTableStageAriaLabel', {
                  defaultMessage: 'Raw data before or after the transformations',
                })}
                data-test-subj="exploreRawTableStageSelect"
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
