/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TimefilterContract } from '../query/timefilter';

interface TimeRangeToolRegistrationProps {
  timefilter: TimefilterContract;
  useAssistantAction?: (config: any) => void;
}

export const TimeRangeToolRegistration: React.FC<TimeRangeToolRegistrationProps> = ({
  timefilter,
  useAssistantAction,
}) => {
  const useAssistantActionHook = useAssistantAction || (() => {});
  useAssistantActionHook({
    name: 'update_time_range',
    description:
      'ONLY use when user explicitly requests to change, update, or set a different time range. Do NOT use for general queries about data.',
    parameters: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'Start time (e.g., "now-1h", "2024-01-01")',
        },
        to: {
          type: 'string',
          description: 'End time (e.g., "now", "2024-01-31")',
        },
      },
      required: ['from', 'to'],
    },
    handler: async (args: { from: string; to: string }) => {
      try {
        timefilter.setTime({ from: args.from, to: args.to });
        return {
          success: true,
          message: `Time range updated to ${args.from} - ${args.to}`,
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

  return null;
};
