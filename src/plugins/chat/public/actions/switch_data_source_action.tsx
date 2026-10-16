/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLoadingSpinner,
  EuiText,
} from '@elastic/eui';
import { useAssistantAction } from '../../../context_provider/public';
import { ChatService } from '../services/chat_service';

import { SWITCH_DATA_SOURCE_TOOL_NAME } from '../../common';

interface SwitchDataSourceArgs {
  // The id of the data source to make active for this conversation.
  dataSourceId?: string;
}

interface SwitchDataSourceResult {
  success: boolean;
  skipped?: boolean;
  dataSourceId?: string;
  datasourceTitle?: string;
  message?: string;
  error?: string;
}

const SwitchDataSourceCard = ({
  status,
  result,
}: {
  status: 'running' | 'complete' | 'error';
  result?: SwitchDataSourceResult | string;
}) => {
  const parsedResult =
    typeof result === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(result);
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
              ? (parsed as SwitchDataSourceResult)
              : undefined;
          } catch {
            return undefined;
          }
        })()
      : result;

  if (parsedResult?.skipped) {
    return null;
  }

  if (status === 'running' && !parsedResult) {
    return (
      <EuiFlexGroup
        alignItems="center"
        gutterSize="xs"
        responsive={false}
        style={{ padding: '2px 0', flexGrow: 0 }}
      >
        <EuiFlexItem grow={false}>
          <EuiLoadingSpinner size="s" />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued">
            {i18n.translate('chat.switchDataSource.switchingGeneric', {
              defaultMessage: 'Switching data source…',
            })}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  const isSuccess = status === 'complete' && parsedResult?.success !== false;

  if (!isSuccess) {
    const errorMsg =
      parsedResult?.message ??
      parsedResult?.error ??
      i18n.translate('chat.switchDataSource.error.default', {
        defaultMessage: 'Failed to switch data source',
      });
    return (
      <EuiFlexGroup
        alignItems="flexStart"
        gutterSize="xs"
        responsive={false}
        style={{ padding: '2px 0', flexGrow: 0 }}
      >
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

  const dsLabel = parsedResult?.datasourceTitle || parsedResult?.dataSourceId || null;

  return (
    <EuiFlexGroup
      alignItems="center"
      gutterSize="xs"
      responsive={false}
      wrap={false}
      style={{ padding: '2px 0', flexGrow: 0 }}
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
        <EuiFlexItem grow={false} style={{ minWidth: 0 }}>
          <EuiBadge color="hollow" style={{ fontWeight: 400, maxWidth: 200 }}>
            {dsLabel}
          </EuiBadge>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};

/**
 * This tool is a pure apply action — it does a single thing: set the confirmed data source.
 * It does NOT ask the user anything, choosing a data source is delegated to the generic `ask_user` tool.
 */
export function useSwitchDataSourceAction(chatService: ChatService, enabled: boolean = true) {
  useAssistantAction<SwitchDataSourceArgs>({
    name: SWITCH_DATA_SOURCE_TOOL_NAME,
    description:
      'WHAT THIS TOOL DOES: sets the active data source for subsequent data-source-aware tools ' +
      '(for example, tools that inspect fields, query data, or create visualizations) only in conversations involving multiple data sources. ' +
      'PRECONDITION: call this tool only when available-data-sources-context is present and its sessionDataSourceList has ' +
      'MORE THAN ONE distinct data source. If zero or exactly one data source has appeared, do NOT call it at all: ' +
      'with one, that data source is already active and calling this tool is redundant; ' +
      'with none, there is nothing to select. ' +
      'WHEN THE PRECONDITION IS MET: determine the data source for the CURRENT request. ' +
      '(1) If the user explicitly named one in the current request by name or by position, e.g. ' +
      '"the first one", call this tool with that id. ' +
      "(2) Otherwise, you MUST FIRST call the ask_user tool (inputType 'select'; one option per data " +
      "source in this conversation, label = the data source's title/name, value = its id) to let " +
      'the user choose, then call this tool with the id they chose. ' +
      'NOTES: (1) A data source id/title in page, panel, visualization, or message context is metadata, not a request to switch. ' +
      '(2) A data source chosen earlier in the conversation does NOT carry over to a new request; ' +
      'do not reuse it silently, guess, or decide on your own that the choice is obvious. ' +
      '(3) A dataset or index-pattern id is not a data source id. ' +
      '(4) Once set, subsequent data-source-aware tools use it automatically; do not pass a data source id to them.',
    parameters: {
      type: 'object',
      properties: {
        dataSourceId: {
          type: 'string',
          description:
            'The user-selected data source id from available-data-sources-context. Must not be a ' +
            'dataset or index-pattern id.',
        },
      },
      required: ['dataSourceId'],
    },
    handler: async (args) => {
      try {
        if (!args.dataSourceId || typeof args.dataSourceId !== 'string') {
          return {
            success: false,
            message: 'A dataSourceId is required to switch the data source.',
          };
        }

        const sessionDataSourceList = chatService.getSessionDataSourceList();
        if (sessionDataSourceList.length <= 1) {
          return {
            success: true,
            skipped: true,
            message:
              `Skipped switch_data_source because this conversation has ` +
              `${sessionDataSourceList.length} data source. No data source switch is needed.`,
          };
        }

        // Validate  first
        const { valid, dataSource, availableDataSources } = await chatService.validateDataSourceId(
          args.dataSourceId
        );

        if (!valid) {
          return {
            success: false,
            message:
              `Unknown dataSourceId "${args.dataSourceId}". Valid data source ids are: ` +
              `${availableDataSources.map((ds) => ds.id).join(', ')}. ` +
              'Note that a dataset or index pattern id is not a data source id.',
          };
        }

        chatService.setDataSourceId(args.dataSourceId);

        const resolvedTitle = dataSource?.title ?? args.dataSourceId;

        return {
          success: true,
          dataSourceId: args.dataSourceId,
          datasourceTitle: resolvedTitle,
          message: `Confirmed "${resolvedTitle}" as the active data source for this conversation.`,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to switch data source',
        };
      }
    },
    render: ({ status, result }) => {
      const cardStatus =
        status === 'complete' ? 'complete' : status === 'failed' ? 'error' : 'running';
      return <SwitchDataSourceCard status={cardStatus} result={result} />;
    },
    useCustomRenderer: true,
    enabled,
  });
}
