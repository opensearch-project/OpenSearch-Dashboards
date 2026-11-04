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
        style={{ padding: '2px 0', flexGrow: 0, width: '100%' }}
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
        style={{ padding: '2px 0', flexGrow: 0, width: '100%' }}
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
      style={{ padding: '2px 0', flexGrow: 0, width: '100%' }}
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
 * This tool is a pure apply action: it records the conversation's data source. It does NOT ask the
 * user anything; when no data source resolves, the chat window shows the data source picker, and
 * the agent is then asked to call this tool to record the user's choice in the conversation.
 */
export function useSwitchDataSourceAction(chatService: ChatService, enabled: boolean = true) {
  useAssistantAction<SwitchDataSourceArgs>({
    name: SWITCH_DATA_SOURCE_TOOL_NAME,
    description:
      'WHAT THIS TOOL DOES: sets the active data source for subsequent data-source-aware tools ' +
      '(for example, tools that inspect fields, query data, or create visualizations). ' +
      'WHEN TO CALL IT: call this tool when the user names an available data source (from ' +
      'available-data-sources-context) that is not the currently active one, passing that data ' +
      "source's id, or when that context asks you to record a data source chosen for the " +
      'conversation (a picker choice, or the data source of what the user asked about). ' +
      'Otherwise do not call it for the data source that is already active. ' +
      'NOTES: (1) A data source id/title in page, panel, visualization, or message context is metadata, not a request to switch. ' +
      '(2) A dataset or index-pattern id is not a data source id. ' +
      '(3) The switch applies from the next step on: do not call other data-source-aware tools in ' +
      'the same step as this tool. After it, they use the new data source automatically; do not ' +
      'pass a data source id to them.',
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

        // The switch belongs to the conversation that asked for it.
        const threadId = chatService.getThreadId();

        // The target must be in the available list, or be found by a direct lookup.
        const { dataSource, available, unverifiable } = await chatService.verifyDataSourceId(
          args.dataSourceId
        );

        if (unverifiable) {
          return {
            success: false,
            message:
              `Could not verify data source "${args.dataSourceId}" right now, so the data ` +
              'source was not switched. Tell the user and ask them to try again.',
          };
        }

        if (!dataSource) {
          return {
            success: false,
            message:
              `Unknown dataSourceId "${args.dataSourceId}". Valid data source ids are: ` +
              `${available.map((ds) => ds.id).join(', ')}. ` +
              'Note that a dataset or index pattern id is not a data source id.',
          };
        }

        const resolvedTitle = dataSource.title;

        // A page whose dataset belongs to a data source (for example Discover or Explore) pins
        // the active data source to it, so a switch to another one would not take effect.
        const pageDataSource = await chatService.getPageDataSource();

        // The user started a new chat or opened another conversation while this was checked:
        // do not write this conversation's switch into that one.
        if (chatService.getThreadId() !== threadId) {
          return {
            success: false,
            message:
              'The conversation changed while switching, so the data source was not switched.',
          };
        }

        if (pageDataSource && pageDataSource.id !== dataSource.id) {
          return {
            success: false,
            message:
              `The data source was not switched to "${resolvedTitle}": the dataset on the ` +
              `current page belongs to "${pageDataSource.title}", and the chat uses the page's ` +
              'data source while the user is on this page. Tell the user to select a dataset ' +
              `from "${resolvedTitle}" on the page, or leave this page, and ask again.`,
          };
        }

        // Already the conversation's recorded data source, with no other choice pending: nothing
        // changes. The result still carries the id, so the history keeps recording it.
        if (
          chatService.getConversationDataSourceId() === dataSource.id &&
          !chatService.getPendingDataSourceId()
        ) {
          return {
            success: true,
            skipped: true,
            dataSourceId: dataSource.id,
            datasourceTitle: resolvedTitle,
            message: `"${resolvedTitle}" is already the active data source. No switch is needed.`,
          };
        }

        // Record it. This also records (or, for another id, replaces) a pending choice: a picker
        // pick, or a data source a caller passed with the message.
        chatService.setConversationDataSource(dataSource.id);

        return {
          success: true,
          dataSourceId: dataSource.id,
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
