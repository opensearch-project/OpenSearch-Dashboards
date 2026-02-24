/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiIcon,
  EuiText,
  EuiSpacer,
  EuiPanel,
  EuiLoadingSpinner,
  EuiEmptyPrompt,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { euiThemeVars } from '@osd/ui-shared-deps/theme';
import { getCategoryBadgeStyle, hexToRgba } from '../../../../services/span_categorization';
import { TimelineSpan, CATEGORY_BADGE_CLASS } from './tree_helpers';
import './timeline_gantt.scss';

export interface TimelineGanttProps {
  timelineVisibleSpans: TimelineSpan[];
  timelineRange: { minMs: number; maxMs: number; durationMs: number };
  selectedNodeId: string | undefined;
  expandedNodes: Set<string>;
  isLoadingFullTree?: boolean;
  fullTreeError?: string;
  onSelectNode: (nodeId: string) => void;
  onToggleExpanded: (nodeId: string) => void;
}

export const TimelineGantt: React.FC<TimelineGanttProps> = ({
  timelineVisibleSpans,
  timelineRange,
  selectedNodeId,
  expandedNodes,
  isLoadingFullTree,
  fullTreeError,
  onSelectNode,
  onToggleExpanded,
}) => {
  return (
    <div className="agentTracesFlyout__timelineWrapper">
      <EuiSpacer size="s" />
      {isLoadingFullTree ? (
        <EuiPanel paddingSize="m" className="agentTracesFlyout__loadingPanel">
          <EuiLoadingSpinner size="l" />
          <EuiSpacer size="s" />
          <EuiText size="s" color="subdued">
            <FormattedMessage
              id="agentTraces.timeline.loadingMessage"
              defaultMessage="Loading trace timeline..."
            />
          </EuiText>
        </EuiPanel>
      ) : fullTreeError ? (
        <EuiEmptyPrompt
          iconType="alert"
          iconColor="danger"
          title={
            <h3>
              <FormattedMessage
                id="agentTraces.timeline.errorLoadingTimeline"
                defaultMessage="Failed to load trace timeline"
              />
            </h3>
          }
          body={<p>{fullTreeError}</p>}
        />
      ) : timelineVisibleSpans.length === 0 || timelineRange.durationMs <= 0 ? (
        <div className="agentTracesFlyout__timelineEmpty">
          <EuiText size="s" color="subdued">
            <FormattedMessage
              id="agentTraces.timeline.noDataMessage"
              defaultMessage="No timing data available for timeline."
            />
          </EuiText>
        </div>
      ) : (
        <div
          className="agentTracesFlyout__timeline"
          style={
            {
              '--agent-traces-row-hover-bg': euiThemeVars.euiColorLightestShade,
              '--agent-traces-row-selected-bg': hexToRgba(euiThemeVars.euiColorPrimary, 0.1),
            } as React.CSSProperties
          }
        >
          <div className="agentTracesFlyout__timelineRows">
            {timelineVisibleSpans.map((span) => {
              const isTimelineSelected = span.node.id === selectedNodeId;
              const offsetPct =
                ((span.startMs - timelineRange.minMs) / timelineRange.durationMs) * 100;
              const widthPct = (span.durationMs / timelineRange.durationMs) * 100;
              const hasValidTiming = span.startMs > 0 && span.endMs > 0;

              return (
                <div
                  key={span.node.id}
                  className={`agentTracesFlyout__timelineRow agentTracesFlyout__timelineRowHeight${
                    isTimelineSelected ? ' agentTracesFlyout__timelineRow--selected' : ''
                  }`}
                  onClick={() => onSelectNode(span.node.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') onSelectNode(span.node.id);
                  }}
                >
                  <div
                    className="agentTracesFlyout__timelineLabel"
                    style={{ paddingLeft: 8 + span.depth * 16 }}
                  >
                    {span.hasChildren ? (
                      <EuiIcon
                        type={expandedNodes.has(span.node.id) ? 'arrowDown' : 'arrowRight'}
                        size="s"
                        color="subdued"
                        className="agentTracesFlyout__timelineLabelExpand"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          onToggleExpanded(span.node.id);
                        }}
                      />
                    ) : (
                      <span className="agentTracesFlyout__timelineSpacer" />
                    )}
                    <span
                      className={`agentTracesFlyout__kindBadge agentTracesFlyout__kindBadge--${
                        CATEGORY_BADGE_CLASS[span.category]
                      }`}
                      style={getCategoryBadgeStyle(span.category)}
                    >
                      {span.category}
                    </span>
                    <span className="agentTracesFlyout__timelineLabelText" title={span.node.label}>
                      <span className="agentTracesFlyout__timelineLabelName">
                        {span.node.label}
                      </span>
                      {span.node.traceRow?.status === 'error' && (
                        <EuiIcon
                          type="alert"
                          color="danger"
                          size="m"
                          className="agentTracesFlyout__timelineErrorIcon"
                        />
                      )}
                    </span>
                  </div>

                  <div className="agentTracesFlyout__timelineBarArea">
                    {hasValidTiming && (
                      <div
                        className={`agentTracesFlyout__timelineBar${
                          isTimelineSelected ? ' agentTracesFlyout__timelineBar--selected' : ''
                        }`}
                        style={{
                          left: `${offsetPct}%`,
                          width: `${Math.max(widthPct, 0.3)}%`,
                          backgroundColor: span.categoryColor,
                        }}
                        title={`${span.node.label} — ${span.node.latency || ''}`}
                      />
                    )}
                  </div>

                  <div className="agentTracesFlyout__timelineLatencyCol">
                    {span.node.latency && span.node.latency !== '—' && (
                      <span className="agentTracesFlyout__timelineLatency">
                        {span.node.latency}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
