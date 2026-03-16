/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  EuiPanel,
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { CORE_SIGNAL_TYPES } from '../../../data/common';
import { ExploreServices } from '../types';
import { detectTraceDataAcrossDataSources, DetectionResult } from '../utils/auto_detect_trace_data';
import { createAutoDetectedDatasets } from '../utils/create_auto_datasets';
import { DiscoverNoIndexPatterns } from '../application/legacy/discover/application/components/no_index_patterns/no_index_patterns';

const DISMISSED_KEY = 'explore:traces:autoDetectDismissed';

export const TraceAutoDetectCallout: React.FC = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const [isDetecting, setIsDetecting] = useState(true);
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Run detection
    const runDetection = async () => {
      // Always check if there are existing trace datasets first
      // This prevents unnecessary wildcard queries when datasets already exist
      try {
        const allIndexPatterns = await services.indexPatterns.getIds();
        if (!isMounted) return;

        let hasTraceDatasets = false;

        for (const id of allIndexPatterns) {
          if (!isMounted) return;
          try {
            const indexPattern = await services.indexPatterns.get(id);
            if (!isMounted) return;

            if (indexPattern.signalType === CORE_SIGNAL_TYPES.TRACES) {
              hasTraceDatasets = true;
              break;
            }
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              return;
            }
            continue;
          }
        }

        if (!isMounted) return;

        // If trace datasets exist, skip detection entirely
        if (hasTraceDatasets) {
          if (isMounted) {
            setIsDismissed(true);
            setIsDetecting(false);
          }
          return;
        }

        // No trace datasets exist - check if user dismissed this before
        const dismissed = localStorage.getItem(DISMISSED_KEY);
        if (dismissed === 'true') {
          // User dismissed and no datasets exist, clear dismissal to show callout again
          localStorage.removeItem(DISMISSED_KEY);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        // If check fails, still try detection
      }

      // Only run detection if no trace datasets exist
      try {
        const results = await detectTraceDataAcrossDataSources(
          services.savedObjects.client,
          services.indexPatterns
        );

        if (!isMounted) return;

        if (results.length > 0) {
          setDetections(results);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        // Detection failed, but don't show any error
      } finally {
        if (isMounted) {
          setIsDetecting(false);
        }
      }
    };

    runDetection();

    return () => {
      isMounted = false;
    };
  }, [services]);

  const handleCreate = async () => {
    if (detections.length === 0) return;

    setIsCreating(true);
    try {
      let totalCreated = 0;
      const dataSourceNames: string[] = [];

      // Create datasets for each detected datasource
      for (const detection of detections) {
        const result = await createAutoDetectedDatasets(services.savedObjects.client, detection);

        if (result.traceDatasetId || result.logDatasetId) {
          totalCreated++;
          if (detection.dataSourceTitle) {
            dataSourceNames.push(detection.dataSourceTitle);
          }
        }
      }

      // Clear dismissed flag so if datasets are deleted later, callout can show again
      localStorage.removeItem(DISMISSED_KEY);

      services.notifications.toasts.addSuccess({
        title: i18n.translate('explore.traces.autoDetect.successTitle', {
          defaultMessage: 'Trace datasets created',
        }),
        text: i18n.translate('explore.traces.autoDetect.successMessageMultiple', {
          defaultMessage:
            'Created trace and log datasets for {count} data {sources}: {names}. Reloading page...',
          values: {
            count: totalCreated,
            sources: totalCreated === 1 ? 'source' : 'sources',
            names: dataSourceNames.join(', '),
          },
        }),
      });

      // Reload after 2 seconds to show the new datasets
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      services.notifications.toasts.addDanger({
        title: i18n.translate('explore.traces.autoDetect.errorTitle', {
          defaultMessage: 'Failed to create datasets',
        }),
        text: (error as Error).message,
      });
      setIsCreating(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setIsDismissed(true);
  };

  // Always show default empty state while detecting, after dismissal, or when no trace data found
  if (isDetecting || isDismissed || detections.length === 0) {
    return <DiscoverNoIndexPatterns />;
  }

  return (
    <EuiFlexGroup justifyContent="center" alignItems="center" gutterSize="none">
      <EuiFlexItem grow={false}>
        <EuiPanel paddingSize="l">
          <EuiFlexGroup direction="column" alignItems="center" gutterSize="m">
            <EuiFlexItem>
              <EuiIcon type="search" size="xl" color="primary" />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiTitle size="m">
                <h2>
                  <FormattedMessage
                    id="explore.traces.autoDetect.title"
                    defaultMessage="Trace Data Detected"
                  />
                </h2>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText textAlign="center" color="subdued" size="s">
                <p>
                  <FormattedMessage
                    id="explore.traces.autoDetect.description"
                    defaultMessage="We found OpenTelemetry trace data in {count} data {sources}. We will create trace datasets to reference the following data:"
                    values={{
                      count: detections.length,
                      sources: detections.length === 1 ? 'source' : 'sources',
                    }}
                  />
                </p>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText size="s">
                <ul style={{ textAlign: 'left' }}>
                  {detections.map((detection, index) => (
                    <React.Fragment key={index}>
                      {detection.dataSourceTitle && (
                        <li style={{ fontWeight: 'bold', marginTop: index > 0 ? '8px' : '0' }}>
                          {detection.dataSourceTitle}:
                        </li>
                      )}
                      {detection.tracesDetected && detection.tracePattern && (
                        <li style={{ marginLeft: detection.dataSourceTitle ? '20px' : '0' }}>
                          <strong>{detection.tracePattern}</strong>{' '}
                          <FormattedMessage
                            id="explore.traces.autoDetect.tracesLabel"
                            defaultMessage="(traces)"
                          />
                        </li>
                      )}
                      {detection.logsDetected && detection.logPattern && (
                        <li style={{ marginLeft: detection.dataSourceTitle ? '20px' : '0' }}>
                          <strong>{detection.logPattern}</strong>{' '}
                          <FormattedMessage
                            id="explore.traces.autoDetect.correlatedLogsLabel"
                            defaultMessage="(correlated logs)"
                          />
                        </li>
                      )}
                    </React.Fragment>
                  ))}
                </ul>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiFlexGroup gutterSize="s" justifyContent="center">
                <EuiFlexItem grow={false}>
                  <EuiButton onClick={handleCreate} isLoading={isCreating} fill>
                    <FormattedMessage
                      id="explore.traces.autoDetect.createButton"
                      defaultMessage="Create Trace Datasets"
                    />
                  </EuiButton>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty onClick={handleDismiss}>
                    <FormattedMessage
                      id="explore.traces.autoDetect.dismissButton"
                      defaultMessage="Dismiss"
                    />
                  </EuiButtonEmpty>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
