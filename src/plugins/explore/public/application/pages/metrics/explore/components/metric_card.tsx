/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiBadge,
  EuiCheckbox,
  EuiToolTip,
  EuiLoadingChart,
  EuiButtonEmpty,
  EuiIcon,
  EuiText,
} from '@elastic/eui';
import { darkMode } from '@osd/ui-shared-deps/theme';
import { i18n } from '@osd/i18n';
import { MetricMetadata, MetricType, TYPE_COLORS, inferMetricType } from '../types';
import { SparklineChart, SERIES_COLORS } from './sparkline';
import { useExploration } from '../contexts/exploration_context';

interface MetricCardProps {
  name: string;
  metadata?: MetricMetadata;
  sparkline: Array<[number, string]> | null;
  sparklineError?: string | null;
  isSelected: boolean;
  colorIndex: number;
  onToggleSelect: () => void;
  onNavigate: () => void;
  onVisibilityChange: (name: string, visible: boolean) => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  name,
  metadata,
  sparkline,
  sparklineError,
  isSelected,
  colorIndex,
  onToggleSelect,
  onNavigate,
  onVisibilityChange,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => onVisibilityChange(name, entry.isIntersecting),
      { rootMargin: '100px' }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      onVisibilityChange(name, false);
    };
  }, [name, onVisibilityChange]);

  const type = inferMetricType(name, metadata?.type || MetricType.UNKNOWN);

  const { onTimeRangeChange } = useExploration();

  const sparklineLabel =
    type === MetricType.COUNTER ? 'sum(rate)' : type === MetricType.HISTOGRAM ? 'p95' : 'avg';

  const chartColor = SERIES_COLORS[colorIndex % SERIES_COLORS.length];

  function renderSparklineContent() {
    if (sparklineError) {
      return (
        <EuiToolTip content={sparklineError}>
          <EuiFlexGroup
            direction="column"
            gutterSize="xs"
            alignItems="center"
            responsive={false}
            style={{ textAlign: 'center' }}
          >
            <EuiFlexItem grow={false}>
              <EuiIcon type="alert" color="danger" size="m" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="xs" color="danger">
                {i18n.translate('explore.metricsExplore.sparklineError', {
                  defaultMessage: 'Query failed',
                })}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiToolTip>
      );
    }
    if (sparkline)
      return (
        <SparklineChart
          values={sparkline}
          height={160}
          stroke={chartColor}
          label={sparklineLabel}
          isDarkMode={darkMode}
          onTimeRangeChange={onTimeRangeChange}
        />
      );
    return <EuiLoadingChart size="m" />;
  }

  return (
    <div ref={cardRef}>
      <EuiPanel
        paddingSize="s"
        hasBorder
        onClick={onToggleSelect}
        style={{
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        aria-label={i18n.translate('explore.metricsExplore.metricCard', {
          defaultMessage: 'Metric card: {name}',
          values: { name },
        })}
        data-test-subj={`metricsExploreCard-${name}`}
      >
        <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false} wrap={false}>
          <EuiFlexItem grow={false} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <EuiCheckbox
              id={`select-${name}`}
              checked={isSelected}
              onChange={onToggleSelect}
              aria-label={i18n.translate('explore.metricsExplore.selectMetric', {
                defaultMessage: 'Select {name}',
                values: { name },
              })}
            />
          </EuiFlexItem>
          <EuiFlexItem style={{ minWidth: 0, overflow: 'hidden' }}>
            <EuiToolTip
              content={
                metadata?.help ? (
                  <>
                    <strong>{name}</strong>
                    <br />
                    {metadata.help}
                  </>
                ) : (
                  name
                )
              }
            >
              <EuiButtonEmpty
                size="xs"
                style={{ maxWidth: '100%' }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onNavigate();
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {name}
                </span>
              </EuiButtonEmpty>
            </EuiToolTip>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiBadge color={TYPE_COLORS[type]}>{type}</EuiBadge>
          </EuiFlexItem>
        </EuiFlexGroup>
        <div
          style={{
            marginTop: 4,
            flex: 1,
            minHeight: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: !sparkline || sparklineError ? 'center' : undefined,
            width: '100%',
          }}
        >
          {renderSparklineContent()}
        </div>
      </EuiPanel>
    </div>
  );
};
