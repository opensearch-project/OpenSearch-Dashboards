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
    // Run detection
    const runDetection = async () => {
      // Check if user dismissed this before
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (dismissed === 'true') {
        // Check if there are any existing trace datasets
        // If not, clear the dismissal so user can see the callout again
        try {
          const allIndexPatterns = await services.indexPatterns.getIds();
          let hasTraceDatasets = false;

          for (const id of allIndexPatterns) {
            try {
              const indexPattern = await services.indexPatterns.get(id);
              if (indexPattern.signalType === 'traces') {
                hasTraceDatasets = true;
                break;
              }
            } catch (error) {
              continue;
            }
          }

          // If no trace datasets exist, clear dismissal and run detection
          if (!hasTraceDatasets) {
            localStorage.removeItem(DISMISSED_KEY);
          } else {
            // Has trace datasets and was dismissed, so keep it dismissed
            setIsDismissed(true);
            setIsDetecting(false);
            return;
          }
        } catch (error) {
          // If check fails, respect the dismissal
          setIsDismissed(true);
          setIsDetecting(false);
          return;
        }
      }
      try {
        const results = await detectTraceDataAcrossDataSources(
          services.savedObjects.client,
          services.indexPatterns
        );

        if (results.length > 0) {
          setDetections(results);
        }
      } catch (error) {
        // Detection failed, but don't show any error
      } finally {
        setIsDetecting(false);
      }
    };

    runDetection();
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
                    defaultMessage="We found trace data matching OpenTelemetry conventions in {count} data {sources}:"
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
