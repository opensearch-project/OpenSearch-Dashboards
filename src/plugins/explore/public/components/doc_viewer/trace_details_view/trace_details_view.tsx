/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './trace_details_view.scss';
import React, { useMemo, useState } from 'react';
import { EuiEmptyPrompt, EuiText, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { TRACE_ID_FIELD_PATHS, SPAN_ID_FIELD_PATHS } from '../../../utils/trace_field_constants';
import { SpanDetailPanel } from '../../../application/pages/traces/trace_details/public/traces/span_detail_panel';
import { DocViewRenderProps } from '../../../types/doc_views_types';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { TracePPLService } from '../../../application/pages/traces/trace_details/server/ppl_request_trace';
import { DataExplorerServices } from '../../../../../data_explorer/public';
import { useDatasetContext } from '../../../application/context';
import {
  transformPPLDataToTraceHits,
  TraceHit,
} from '../../../application/pages/traces/trace_details/public/traces/ppl_to_trace_hits';
import { generateColorMap } from '../../../application/pages/traces/trace_details/public/traces/generate_color_map';

const extractTraceIdFromHit = (hit: any): string | null => {
  for (const path of TRACE_ID_FIELD_PATHS) {
    const value = getNestedValue(hit, path);
    if (value && typeof value === 'string') {
      return value;
    }
  }

  return null;
};

const extractSpanIdFromHit = (hit: any): string | null => {
  for (const path of SPAN_ID_FIELD_PATHS) {
    const value = getNestedValue(hit, path);
    if (value && typeof value === 'string') {
      return value;
    }
  }

  return null;
};

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

const isOnTracesFlavor = (): boolean => {
  const currentPath = window.location.pathname;
  const currentHash = window.location.hash;

  return currentPath.includes('/explore/traces') || currentHash.includes('/explore/traces');
};

// Trace Details view component for the doc viewer accordion - Timeline only
export function TraceDetailsView({ hit }: DocViewRenderProps) {
  const [transformedHits, setTransformedHits] = useState<TraceHit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedSpanId, setSelectedSpanId] = useState<string | undefined>(undefined);

  const {
    services: { data, chrome },
  } = useOpenSearchDashboards<DataExplorerServices>();

  const { dataset } = useDatasetContext();

  const isOnTraces = isOnTracesFlavor();

  const traceInfo = useMemo(() => {
    if (!isOnTraces) {
      return null;
    }

    const traceId = extractTraceIdFromHit(hit);

    if (!traceId) {
      return null;
    }

    const spanId = extractSpanIdFromHit(hit);

    const queryDataset = data?.query?.queryString?.getQuery()?.dataset;
    const currentDataset = queryDataset || dataset;

    return {
      traceId,
      spanId,
      dataset: {
        id: currentDataset?.id || 'default-dataset-id',
        title: currentDataset?.title || 'otel-v1-apm-span-*',
        type: currentDataset?.type || 'INDEX_PATTERN',
        timeFieldName: currentDataset?.timeFieldName,
        // Preserve dataSource information for external data sources
        ...((currentDataset as any)?.dataSource && {
          dataSource: (currentDataset as any).dataSource,
        }),
        ...((currentDataset as any)?.dataSourceRef && {
          dataSource: (currentDataset as any).dataSourceRef,
        }),
      },
    };
  }, [hit, dataset, isOnTraces, data]);

  const pplService = useMemo(() => (data ? new TracePPLService(data) : undefined), [data]);

  const colorMap = useMemo(() => {
    try {
      if (transformedHits.length > 0) {
        return generateColorMap(transformedHits);
      }
      return {};
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error generating color map:', error);
      return {};
    }
  }, [transformedHits]);

  // Load trace data when component mounts
  React.useEffect(() => {
    const fetchData = async () => {
      if (!pplService || !traceInfo?.traceId || !traceInfo?.dataset) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await pplService.fetchTraceSpans({
          traceId: traceInfo.traceId,
          dataset: traceInfo.dataset,
          limit: 100,
          filters: [],
        });

        const transformed = transformPPLDataToTraceHits(response);
        setTransformedHits(transformed);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch trace data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (traceInfo) {
      fetchData();
    }
  }, [pplService, traceInfo]);

  // Only show trace details view when on traces flavor
  if (!isOnTraces) {
    return null;
  }

  // Show empty state if no trace data is available
  if (!traceInfo) {
    return (
      <div className="exploreTraceDetailsView__empty">
        <EuiEmptyPrompt
          iconType="search"
          title={
            <h4>
              {i18n.translate('explore.docViews.traceDetails.noTrace.title', {
                defaultMessage: 'No trace data found',
              })}
            </h4>
          }
          body={
            <>
              <EuiText size="s">
                {i18n.translate('explore.docViews.traceDetails.noTrace.description', {
                  defaultMessage:
                    'No trace ID found in this document. Make sure this document contains trace data with a valid trace ID field.',
                })}
              </EuiText>
              <EuiSpacer size="s" />
              <EuiText size="xs" color="subdued">
                {i18n.translate('explore.docViews.traceDetails.noTrace.hint', {
                  defaultMessage: 'Trace ID fields searched: traceId, trace_id, traceID',
                })}
              </EuiText>
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="exploreTraceDetailsView">
      {isLoading ? (
        <div className="exploreTraceDetailsView__loadingContainer">
          <EuiText>
            {i18n.translate('explore.docViews.traceDetails.loading', {
              defaultMessage: 'Loading trace gantt chart...',
            })}
          </EuiText>
        </div>
      ) : transformedHits.length > 0 ? (
        <SpanDetailPanel
          chrome={chrome}
          spanFilters={[]}
          payloadData={JSON.stringify(transformedHits)}
          isGanttChartLoading={false}
          colorMap={colorMap}
          onSpanSelect={(spanId) => {
            setSelectedSpanId(spanId);
          }}
          selectedSpanId={selectedSpanId || traceInfo.spanId || undefined}
          activeView="timeline"
          isEmbedded={true}
        />
      ) : (
        <div className="exploreTraceDetailsView__emptyState">
          <EuiText color="subdued">
            {i18n.translate('explore.docViews.traceDetails.noData', {
              defaultMessage: 'No trace data available',
            })}
          </EuiText>
        </div>
      )}
    </div>
  );
}
