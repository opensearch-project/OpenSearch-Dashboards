/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { EuiBadge, EuiFlexGroup, EuiFlexItem, EuiIcon, EuiText } from '@elastic/eui';
import { useAssistantAction } from '../../../context_provider/public';
import { ChatService } from '../services/chat_service';

import { SWITCH_DATA_SOURCE_TOOL_NAME } from '../../common';

interface SwitchDataSourceArgs {
  dataSourceId: string;
  datasourceTitle?: string;
  reason?: string;
}

interface SwitchDataSourceResult {
  success: boolean;
  dataSourceId?: string;
  datasourceTitle?: string;
  message?: string;
}

const SwitchDataSourceCard: React.FC<{
  status: 'running' | 'completed' | 'error';
  args?: SwitchDataSourceArgs;
  result?: string | SwitchDataSourceResult;
}> = ({ status, args, result }) => {
  // result may arrive as a JSON string (from toolCall.result) or an already-parsed object
  let parsedResult: SwitchDataSourceResult | null = null;
  if (result && typeof result === 'object') {
    parsedResult = result as SwitchDataSourceResult;
  } else if (typeof result === 'string') {
    try {
      const parsed = JSON.parse(result);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        parsedResult = parsed as SwitchDataSourceResult;
      }
    } catch {
      // skip
    }
  }

  const isSuccess = status === 'completed' && parsedResult?.success !== false;
  const dataSourceId = parsedResult?.dataSourceId ?? args?.dataSourceId;
  const dataSourceTitle = parsedResult?.datasourceTitle ?? args?.datasourceTitle;
  const dsLabel = dataSourceTitle || dataSourceId || null;

  if (status === 'running') {
    return (
      <EuiFlexGroup alignItems="center" gutterSize="xs" style={{ padding: '2px 0', height: 24 }}>
        <EuiFlexItem grow={false}>
          <EuiIcon type="database" size="s" color="subdued" />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued">
            {i18n.translate('chat.switchDataSource.switching', {
              defaultMessage: 'Switching data source\u2026',
            })}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  if (!isSuccess) {
    const errorMsg =
      parsedResult?.message ??
      (typeof result === 'string' ? result : null) ??
      i18n.translate('chat.switchDataSource.error.default', {
        defaultMessage: 'Failed to switch data source',
      });
    return (
      <EuiFlexGroup alignItems="center" gutterSize="xs" style={{ padding: '2px 0', height: 24 }}>
        <EuiFlexItem grow={false}>
          <EuiIcon type="alert" size="s" color="danger" />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="danger">
            {errorMsg}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  return (
    <EuiFlexGroup
      alignItems="center"
      gutterSize="xs"
      style={{ padding: '2px 0', height: 24 }}
      wrap={false}
    >
      <EuiFlexItem grow={false}>
        <EuiIcon type="database" size="s" color="primary" />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiText size="xs" color="subdued">
          {i18n.translate('chat.switchDataSource.switchedTo', {
            defaultMessage: 'Switched to',
          })}
        </EuiText>
      </EuiFlexItem>
      {dsLabel && (
        <EuiFlexItem grow={false}>
          <EuiBadge color="hollow" style={{ fontWeight: 400 }}>
            {dsLabel}
          </EuiBadge>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};

/**
 * Registers the switch_data_source tool so the LLM can change the active data source
 * mid-conversation.
 */
export function useSwitchDataSourceAction(chatService: ChatService, enabled: boolean = true) {
  useAssistantAction<SwitchDataSourceArgs>({
    name: SWITCH_DATA_SOURCE_TOOL_NAME,
    description:
      'Switch the active data source for ALL subsequent tool calls ' +
      '(IndexMappingTool, SearchIndexTool, PPLQueryTool, auto_create_visualization, etc.). ' +
      'You MUST call this tool BEFORE any data query tool whenever the target data source ' +
      'differs from the currently active one. ' +
      'Once switched, the other tools pick up the new data source automatically — ' +
      'you do not need to pass a data source id to them. ' +
      'The available data sources and the currently active one are listed in the ' +
      'available_data_sources context — check that context to identify the correct id ' +
      'before switching.',
    parameters: {
      type: 'object',
      properties: {
        dataSourceId: {
          type: 'string',
          description:
            'The ID of the data source to switch to. ' +
            'It MUST be one of the ids listed in the available_data_sources context, or a ' +
            'data source id given by the user. It may also come from the page context ' +
            '— but note that a dataset/index pattern id ' +
            '(dataset.id) is NOT a data source id and will be rejected.',
        },
        reason: {
          type: 'string',
          description:
            'Optional. Brief explanation of why this data source is being selected ' +
            '(e.g. "switching to the data source used by the Flights panel").',
        },
        datasourceTitle: {
          type: 'string',
          description:
            'Optional. The human-readable title of the data source. ' +
            'Get this from the available_data_sources context alongside dataSourceId.',
        },
      },
      required: ['dataSourceId'],
    },
    handler: async (args) => {
      try {
        if (!args.dataSourceId || typeof args.dataSourceId !== 'string') {
          return {
            success: false,
            message: i18n.translate('chat.switchDataSource.error.invalidId', {
              defaultMessage: 'dataSourceId must be a non-empty string',
            }),
          };
        }

        // Validate before writing to ChatService
        const { valid, dataSource, availableDataSources } = await chatService.validateDataSourceId(
          args.dataSourceId
        );

        if (!valid) {
          return {
            success: false,
            message: i18n.translate('chat.switchDataSource.error.unknownId', {
              defaultMessage:
                'Unknown dataSourceId "{id}". Valid data source ids are: {ids}. ' +
                'Note that a dataset or index pattern id is not a data source id.',
              values: {
                id: args.dataSourceId,
                ids: availableDataSources.map((ds) => ds.id).join(', '),
              },
            }),
          };
        }

        chatService.setLLMDataSourceId(args.dataSourceId);

        const resolvedTitle = dataSource?.title ?? args.datasourceTitle;

        return {
          success: true,
          dataSourceId: args.dataSourceId,
          datasourceTitle: resolvedTitle,
          message: i18n.translate('chat.switchDataSource.success.message', {
            defaultMessage:
              'Active data source switched to "{title}". All subsequent data queries will use this data source.',
            values: { title: resolvedTitle ?? args.dataSourceId },
          }),
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : i18n.translate('chat.switchDataSource.error.unknown', {
                  defaultMessage: 'Failed to switch data source',
                }),
        };
      }
    },
    render: ({ status, args, result }) => {
      const cardStatus =
        status === 'complete' ? 'completed' : status === 'failed' ? 'error' : 'running';
      return <SwitchDataSourceCard status={cardStatus} args={args} result={result} />;
    },
    useCustomRenderer: true,
    enabled,
  });
}
