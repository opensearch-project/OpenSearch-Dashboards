/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { EuiBadge, EuiIcon, EuiText } from '@elastic/eui';
import { euiThemeVars } from '@osd/ui-shared-deps/theme';
import {
  CategorizedSpan,
  getCategoryBadgeStyle,
  getCategoryMeta,
  hexToRgba,
  SpanCategory,
} from '../../../../services/span_categorization';
import { CATEGORY_BADGE_CLASS, parseLatencyMs } from '../flyout/tree_helpers';
import '../flyout/trace_details_flyout.scss';
import './span_node.scss';

interface SpanNodeProps {
  data: {
    span: CategorizedSpan;
    totalDuration: number;
  };
  selected?: boolean;
}

const CATEGORY_ICON: Record<SpanCategory, string> = {
  AGENT: 'user',
  LLM: 'bolt',
  TOOL: 'wrench',
  OTHER: 'dot',
};

function SpanNodeComponent({ data, selected }: SpanNodeProps) {
  const { span, totalDuration } = data;
  const meta = getCategoryMeta(span.category);
  const iconType = CATEGORY_ICON[span.category];
  const color = meta.color;
  const bgColor = hexToRgba(color, 0.1);

  // Use the pre-computed latency string from TraceRow (TraceRow has no endTime)
  const durationMs = parseLatencyMs(span.latency);
  const durationPercent = totalDuration > 0 ? Math.min((durationMs / totalDuration) * 100, 100) : 0;

  const handleColor = getCategoryMeta('OTHER').color;

  return (
    <div
      className="agentTracesFlow__spanNode"
      style={{
        border: `2px solid ${color}`,
        backgroundColor: bgColor,
        boxShadow: selected ? `0 0 0 2px ${color}` : '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      {/* Input handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="agentTracesFlow__handle"
        style={{
          background: handleColor,
          border: `2px solid ${euiThemeVars.euiColorDarkShade}`,
        }}
      />

      {/* Header: Icon + Category Badge */}
      <div className="agentTracesFlow__header">
        <EuiIcon type={iconType} size="s" color={color} />
        <span
          className={`agentTracesFlyout__kindBadge agentTracesFlyout__kindBadge--${
            CATEGORY_BADGE_CLASS[span.category]
          }`}
          style={getCategoryBadgeStyle(span.category)}
        >
          {span.category}
        </span>
        {span.status === 'error' && (
          <EuiBadge color="danger" className="agentTracesFlow__errorBadge">
            ERR
          </EuiBadge>
        )}
      </div>

      {/* Display Name */}
      <EuiText
        size="xs"
        className="agentTracesFlow__displayName"
        style={{
          fontFamily: 'monospace',
          color: span.status === 'error' ? euiThemeVars.euiColorDanger : euiThemeVars.euiTextColor,
        }}
        title={span.displayName}
      >
        {span.displayName}
      </EuiText>

      {/* Duration Bar */}
      <div className="agentTracesFlow__durationRow">
        <div className="agentTracesFlow__durationTrack">
          <div
            className="agentTracesFlow__durationFill"
            style={{
              width: `${Math.max(durationPercent, 5)}%`,
              backgroundColor: color,
            }}
          />
        </div>
        <EuiText
          size="xs"
          className="agentTracesFlow__durationText"
          style={{ fontFamily: 'monospace' }}
        >
          {span.latency || '—'}
        </EuiText>
      </div>

      {/* Output handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="agentTracesFlow__handle"
        style={{
          background: handleColor,
          border: `2px solid ${euiThemeVars.euiColorDarkShade}`,
        }}
      />
    </div>
  );
}

export const SpanNode = memo(SpanNodeComponent);
