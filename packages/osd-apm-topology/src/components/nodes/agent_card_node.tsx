/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import type { Node, NodeProps } from '@xyflow/react';
import type { AgentNodeData } from '../../shared/types/agent.types';
import { AGENT_NODE_KINDS } from '../../shared/constants/agent.constants';
import { getProviderIcon } from '../../shared/constants/provider_icons.constants';
import { useCelestialNodeActionsContext } from '../../shared/contexts/node_actions_context';
import { NodeShell } from './node_shell';
import { TypeBadge } from './type_badge';
import { MetricBar, MetricBarGroup } from './metric_bar';
import { StatusIndicator } from './status_indicator';
import './agent_card_node.scss';

export type AgentCardCustomNode = Node<AgentNodeData, string>;

/**
 * Agent/LLM/Tool card node.
 * Renders a type badge, title, duration bar, latency, and status icon.
 */
export const AgentCardNode = ({ data }: NodeProps<AgentCardCustomNode>) => {
  const kindConfig = AGENT_NODE_KINDS[data.nodeKind] ?? AGENT_NODE_KINDS.agent;
  const { onDashboardClick, selectedNodeId } = useCelestialNodeActionsContext();
  const isSelected = data.id === selectedNodeId;

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      onDashboardClick?.(event, data as any);
    },
    [onDashboardClick, data]
  );

  const providerIconSrc = getProviderIcon(data.provider);

  // When metrics array is provided, skip the standalone duration bar to avoid duplication
  const showStandaloneDuration =
    data.duration !== undefined && (!data.metrics || data.metrics.length === 0);

  return (
    <NodeShell
      borderColor={kindConfig.color}
      glowColor={kindConfig.color}
      isSelected={isSelected}
      isFaded={!!data.isFaded}
      onClick={handleClick}
      className="osd:bg-container-default osd:w-68 osd:min-h-20 osd:p-3"
      data-test-subj={`agentCardNode-${data.id}`}
    >
      <div className="osd:flex osd:flex-col osd:gap-2">
        {/* Header: Type badge + Status indicator */}
        <div className="osd:flex osd:items-center osd:justify-between">
          <TypeBadge
            label={kindConfig.label}
            color={kindConfig.color}
            textColor={kindConfig.textColor}
            icon={
              <img
                src={kindConfig.icon}
                alt=""
                className="osd:w-3 osd:h-3 celAgentCard__kind-icon"
              />
            }
          />
          {data.status && (
            <StatusIndicator status={data.status} label={data.statusLabel} icon={data.statusIcon} />
          )}
        </div>

        {/* Title */}
        <div className="osd:font-bold osd:text-sm osd:text-body-default osd:truncate">
          {data.title}
        </div>

        {/* Model name for LLM nodes (with optional provider icon) */}
        {data.model && (
          <div className="osd:flex osd:items-center osd:gap-1 osd:text-xs osd:text-body-secondary osd:truncate">
            {providerIconSrc && (
              <img
                src={providerIconSrc}
                alt=""
                className="osd:w-4 osd:h-4 osd:flex-shrink-0 celAgentCard__provider-icon"
              />
            )}
            {data.model}
          </div>
        )}

        {/* Duration bar (only when no metrics array to avoid duplication) */}
        {showStandaloneDuration && (
          <MetricBar
            value={data.duration!}
            max={data.duration! * 2}
            color={kindConfig.color}
            label={data.latency ?? `${data.duration}ms`}
          />
        )}

        {/* Multiple metric bars */}
        {data.metrics && data.metrics.length > 0 && <MetricBarGroup metrics={data.metrics} />}
      </div>
    </NodeShell>
  );
};
