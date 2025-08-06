/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './trace_details_view.scss';
import React, { useMemo, useState } from 'react';
import { EuiEmptyPrompt, EuiText, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
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
  // Try different possible field paths for trace ID
  const possiblePaths = [
    'traceId',
    'trace_id',
    'traceID',
    '_source.traceId',
    '_source.trace_id',
    '_source.traceID',
    'fields.traceId',
    'fields.trace_id',
    'fields.traceID',
  ];

  for (const path of possiblePaths) {
    const value = getNestedValue(hit, path);
    if (value && typeof value === 'string') {
      return value;
    }
  }

  return null;
};

const extractSpanIdFromHit = (hit: any): string | null => {
  // Try different possible field paths for span ID
  const possiblePaths = [
    'spanId',
    'span_id',
    'spanID',
    '_source.spanId',
    '_source.span_id',
    '_source.spanID',
    'fields.spanId',
    'fields.span_id',
    'fields.spanID',
  ];

  for (const path of possiblePaths) {
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

const extractIndexPattern = (indexPattern: any, dataset: any): string => {
  // First try to get from dataset context (from the page's index pattern)
  if (dataset?.title) {
    return dataset.title;
  }

  // Second try to get from URL parameters
  try {
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(hash.split('?')[1]);
    const qParam = urlParams.get('_q');
    if (qParam) {
      const decodedQ = decodeURIComponent(qParam);

      // Look for dataset title in the URL parameters
      const titleMatch = decodedQ.match(/title:'([^']+)'/);
      if (titleMatch) {
        return titleMatch[1];
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to extract index pattern from URL:', error);
  }

  // Fallback to default pattern
  return 'otel-v1-apm-span-*';
};

const isOnTracesFlavor = (): boolean => {
  const currentPath = window.location.pathname;
  const currentHash = window.location.hash;

  return currentPath.includes('/explore/traces') || currentHash.includes('/explore/traces');
};

// Trace Details view component for the doc viewer accordion - Timeline only
export function TraceDetailsView({ hit, indexPattern }: DocViewRenderProps) {
  const [transformedHits, setTransformedHits] = useState<TraceHit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    services: { data, chrome },
  } = useOpenSearchDashboards<DataExplorerServices>();

  // Get dataset context to access the current index pattern
  const { dataset } = useDatasetContext();

  // Check if we're on traces flavor
  const isOnTraces = isOnTracesFlavor();

  // Extract trace information from the hit
  const traceInfo = useMemo(() => {
    if (!isOnTraces) {
      return null;
    }

    const traceId = extractTraceIdFromHit(hit);

    if (!traceId) {
      return null;
    }

    const spanId = extractSpanIdFromHit(hit);
    const indexPatternTitle = extractIndexPattern(indexPattern, dataset);

    return {
      traceId,
      spanId,
      dataset: {
        id: dataset?.id || 'default-dataset-id',
        title: indexPatternTitle,
        type: dataset?.type || 'INDEX_PATTERN',
        timeFieldName: dataset?.timeFieldName,
      },
    };
  }, [hit, indexPattern, dataset, isOnTraces]);

  // Create PPL service instance
  const pplService = useMemo(() => (data ? new TracePPLService(data) : undefined), [data]);

  // Generate dynamic color map based on hits
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
          <EuiText>Loading trace timeline...</EuiText>
        </div>
      ) : transformedHits.length > 0 ? (
        <SpanDetailPanel
          chrome={chrome}
          spanFilters={[]}
          payloadData={JSON.stringify(transformedHits)}
          isGanttChartLoading={false}
          dataSourceMDSId={dataset?.id || ''}
          colorMap={colorMap}
          onSpanSelect={undefined}
          selectedSpanId={traceInfo.spanId || undefined}
          activeView="timeline"
          isEmbedded={true}
        />
      ) : (
        <div className="exploreTraceDetailsView__emptyState">
          <EuiText color="subdued">No trace data available</EuiText>
        </div>
      )}
    </div>
  );
}
