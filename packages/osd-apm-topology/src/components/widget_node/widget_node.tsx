/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import { getIcon } from '../../shared/utils/icons.utils';
import { DEFAULT_METRICS } from '../../shared/constants/common.constants';
import { HealthDonut } from '../health_donut';

const ICON_SIZE = 60;

export interface WidgetNodeProps {
  id: string;
  title: string;
  subtitle?: string;
  type: string; // This will determine the icon and also be the subtitle if not provided
  status: string; // one of ok|fault|error
  isSource?: boolean;
  isTarget?: boolean;
}

export type WidgetNodeType = Node<WidgetNodeProps, 'widget'>;
export const WidgetNode = (props: NodeProps<WidgetNodeType>) => {
  const {
    data: { title, subtitle, type, status, isSource, isTarget },
  } = props;
  return (
    <div className="osd:flex osd:flex-col osd:items-center">
      <div>
        <HealthDonut
          metrics={{ ...DEFAULT_METRICS }}
          size={ICON_SIZE}
          icon={getIcon(type)}
          status={status}
        >
          {isSource && (
            <Handle
              type="source"
              position={Position.Right}
              id="source-right"
              style={{ opacity: 0 }}
            />
          )}
          {isTarget && (
            <Handle
              type="target"
              position={Position.Left}
              id="target-left"
              style={{ opacity: 0 }}
            />
          )}
        </HealthDonut>
      </div>
      <div className="osd:mt-1 osd:text-center">
        <div className="osd:font-medium osd:text-xs">{title}</div>
        {subtitle && <div className="osd:text-xs osd:text-gray-500">{subtitle || type}</div>}
      </div>
    </div>
  );
};

// eslint-disable-next-line import/no-default-export
export default WidgetNode;
