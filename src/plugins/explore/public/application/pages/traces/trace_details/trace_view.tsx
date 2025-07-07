/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { i18n } from '@osd/i18n';
import { EuiPage, EuiPageBody, EuiSpacer, EuiPanel, EuiLoadingSpinner } from '@elastic/eui';
import { useLocation } from 'react-router-dom';
import { TraceTopNavMenu } from './public/top_nav_buttons';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { TracePPLService } from './server/ppl_request_trace';
import { MountPoint } from '../../../../../../../core/public';
import { transformPPLDataToTraceHits } from './public/traces/ppl_to_trace_hits';
import { DataExplorerServices } from '../../../../../../data_explorer/public';
import { LogsDetails } from './public/logs/log_detail';
import { generateColorMap } from './public/traces/generate_color_map';
import { SpanDetailPanel } from './public/traces/span_detail_panel';
import { ServiceMap } from './public/services/service_map';
import { NoMatchMessage } from './public/utils/helper_functions';

export interface TraceDetailsProps {
  setMenuMountPoint?: (mount: MountPoint | undefined) => void;
}

export const TraceDetails: React.FC<TraceDetailsProps> = ({ setMenuMountPoint }) => {
  const {
    services: { chrome, data },
  } = useOpenSearchDashboards<DataExplorerServices>();
  const location = useLocation();
  // Extract search params from the hash part after ?
  const searchString = location.hash.includes('?')
    ? location.hash.substring(location.hash.indexOf('?'))
    : '';
  const qs = new URLSearchParams(searchString);
  const [transformedHits, setTransformedHits] = useState<any[]>([]);
  const [spanFilters, setSpanFilters] = useState<any[]>([]);
  const [pplQueryData, setPplQueryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [unfilteredHits, setUnfilteredHits] = useState<any[]>([]);
  const [logsAvailableWidth, setLogsAvailableWidth] = useState<number>(window.innerWidth);
  const logsContainerRef = useRef<HTMLDivElement | null>(null);
  const traceId = qs.get('traceId') || '';
  const dataSourceId = qs.get('datasourceId') || '';

  // Create PPL service instance
  const pplService = useMemo(() => (data ? new TracePPLService(data) : undefined), [data]);

  // Generate dynamic color map based on unfiltered hits
  const colorMap = useMemo(() => {
    try {
      if (unfilteredHits.length > 0) {
        return generateColorMap(unfilteredHits);
      }
      return {};
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error generating color map:', error);
      return {};
    }
  }, [unfilteredHits]);

  const setSpanFiltersWithStorage = (newFilters: any[]) => {
    setSpanFilters(newFilters);
  };

  // Update logs container width
  const updateLogsAvailableWidth = () => {
    if (logsContainerRef.current) {
      const w = logsContainerRef.current.getBoundingClientRect().width;
      setLogsAvailableWidth(w - 32);
    } else {
      setLogsAvailableWidth(window.innerWidth - 80);
    }
  };

  useEffect(() => {
    window.addEventListener('resize', updateLogsAvailableWidth);
    setTimeout(updateLogsAvailableWidth, 100);
    return () => window.removeEventListener('resize', updateLogsAvailableWidth);
  }, []);

  useEffect(() => {
    if (logsContainerRef.current) {
      updateLogsAvailableWidth();
    }
  }, []);

  useEffect(() => {
    chrome?.setBreadcrumbs([
      {
        text:
          traceId ||
          i18n.translate('explore.traceDetails.breadcrumb.unknownTrace', {
            defaultMessage: 'Unknown Trace',
          }),
      },
    ]);
  }, [chrome, traceId]);

  useEffect(() => {
    const fetchData = async (filters: any[] = []) => {
      if (!pplService || !traceId || !dataSourceId) return;
      setIsLoading(true);
      try {
        const response = await pplService.fetchTraceSpans({
          traceId,
          dataSourceId,
          indexPattern: 'otel-v1-apm-span-*',
          limit: 100,
          filters,
        });
        setPplQueryData(response);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch trace data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (traceId && dataSourceId && pplService) {
      fetchData(spanFilters);
    }
  }, [traceId, dataSourceId, pplService, spanFilters]);

  useEffect(() => {
    if (!pplQueryData) return;
    // Transform the PPL data to trace hits format
    const transformed = transformPPLDataToTraceHits(pplQueryData);
    const hits = transformed.length > 0 ? transformed : [];
    setTransformedHits(hits);
    if (spanFilters.length === 0) {
      setUnfilteredHits(hits);
    }
  }, [pplQueryData, spanFilters.length]);

  return (
    <>
      <TraceTopNavMenu
        payloadData={transformedHits}
        setMenuMountPoint={setMenuMountPoint}
        dataSourceMDSId={[{ id: dataSourceId, label: '' }]}
        traceId={traceId}
      />

      <EuiPage>
        <EuiPageBody>
          {isLoading ? (
            <EuiPanel paddingSize="l">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 200,
                }}
              >
                <EuiLoadingSpinner size="xl" />
              </div>
            </EuiPanel>
          ) : (
            <>
              {transformedHits.length === 0 && <NoMatchMessage traceId={traceId} />}

              {transformedHits.length > 0 && (
                <>
                  <SpanDetailPanel
                    chrome={chrome}
                    spanFilters={spanFilters}
                    setSpanFiltersWithStorage={setSpanFiltersWithStorage}
                    payloadData={JSON.stringify(transformedHits)}
                    isGanttChartLoading={isLoading}
                    dataSourceMDSId={dataSourceId}
                    dataSourceMDSLabel={undefined}
                    traceId={traceId}
                    pplService={pplService}
                    indexPattern="otel-v1-apm-span-*"
                    colorMap={colorMap}
                  />
                  <EuiSpacer size="m" />

                  <ServiceMap
                    hits={transformedHits}
                    colorMap={colorMap}
                    paddingSize="s"
                    hasShadow={false}
                  />
                  <EuiSpacer size="m" />

                  <div ref={logsContainerRef}>
                    <LogsDetails
                      traceId={traceId}
                      dataSourceId={dataSourceId}
                      pplService={pplService}
                      availableWidth={logsAvailableWidth}
                      traceData={transformedHits}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </EuiPageBody>
      </EuiPage>
    </>
  );
};
