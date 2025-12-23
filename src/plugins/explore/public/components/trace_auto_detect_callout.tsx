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
import { detectTraceData, DetectionResult } from '../utils/auto_detect_trace_data';
import { createAutoDetectedDatasets } from '../utils/create_auto_datasets';
import { DiscoverNoIndexPatterns } from '../application/legacy/discover/application/components/no_index_patterns/no_index_patterns';

const DISMISSED_KEY = 'explore:traces:autoDetectDismissed';

export const TraceAutoDetectCallout: React.FC = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const [isDetecting, setIsDetecting] = useState(true);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
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
        const result = await detectTraceData(
          services.savedObjects.client,
          services.indexPatterns,
          undefined // TODO: Get current data source ID from context/state
        );

        if (result.tracesDetected || result.logsDetected) {
          setDetection(result);
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
    if (!detection) return;

    setIsCreating(true);
    try {
      const result = await createAutoDetectedDatasets(
        services.savedObjects.client,
        detection,
        undefined // TODO: Get current data source ID from context/state
      );

      // Clear dismissed flag so if datasets are deleted later, callout can show again
      localStorage.removeItem(DISMISSED_KEY);

      services.notifications.toasts.addSuccess({
        title: i18n.translate('explore.traces.autoDetect.successTitle', {
          defaultMessage: 'Trace datasets created',
        }),
        text: i18n.translate('explore.traces.autoDetect.successMessage', {
          defaultMessage:
            'Created {traceDataset}{separator}{logDataset}{correlation}. Reloading page...',
          values: {
            traceDataset: result.traceDatasetId
              ? i18n.translate('explore.traces.autoDetect.traceDataset', {
                  defaultMessage: 'trace dataset',
                })
              : '',
            separator: result.traceDatasetId && result.logDatasetId ? ' and ' : '',
            logDataset: result.logDatasetId
              ? i18n.translate('explore.traces.autoDetect.logDataset', {
                  defaultMessage: 'log dataset',
                })
              : '',
            correlation: result.correlationId
              ? i18n.translate('explore.traces.autoDetect.withCorrelation', {
                  defaultMessage: ' with correlation',
                })
              : '',
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
  if (
    isDetecting ||
    isDismissed ||
    !detection ||
    (!detection.tracesDetected && !detection.logsDetected)
  ) {
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
                    defaultMessage="We found trace data matching OpenTelemetry conventions in your cluster:"
                  />
                </p>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText size="s">
                <ul style={{ textAlign: 'left' }}>
                  {detection.tracesDetected && detection.tracePattern && (
                    <li>
                      <strong>{detection.tracePattern}</strong>{' '}
                      <FormattedMessage
                        id="explore.traces.autoDetect.tracesLabel"
                        defaultMessage="(traces)"
                      />
                    </li>
                  )}
                  {detection.logsDetected && detection.logPattern && (
                    <li>
                      <strong>{detection.logPattern}</strong>{' '}
                      <FormattedMessage
                        id="explore.traces.autoDetect.correlatedLogsLabel"
                        defaultMessage="(correlated logs)"
                      />
                    </li>
                  )}
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
