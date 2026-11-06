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
 * This tool is a pure apply action — it does a single thing: set the conversation's active data source.
 * It does NOT ask the user anything, choosing a data source is delegated to the generic `ask_user` tool.
 */
export function useSwitchDataSourceAction(chatService: ChatService, enabled: boolean = true) {
  useAssistantAction<SwitchDataSourceArgs>({
    name: SWITCH_DATA_SOURCE_TOOL_NAME,
    description:
      'WHAT THIS TOOL DOES: sets the active data source of this conversation. Data-source-aware tools ' +
      '(for example, tools that inspect fields, query data, or create visualizations) run against it, ' +
      'in this request and in later ones. ' +
      'PRECONDITION: call this tool only when available-data-sources-context is present, and only with an id ' +
      'listed there that is different from the currently active data source. ' +
      'WHEN TO CALL IT: (1) The current request is about data in another listed data source, for example the ' +
      'user named it by name or by position ("the first one"), or the request clearly concerns data that only ' +
      "that data source has. (2) You asked the user to choose with the ask_user tool (inputType 'select', " +
      'one option per data source name) and the user chose one. ' +
      'If it is unclear which data source the request is about, ask with ask_user first instead of guessing. ' +
      'If the request is about the active data source, do NOT call this tool. ' +
      'WHEN NOT TO CALL IT: a data source shown on the current page, or in page, panel or visualization ' +
      'context, is not by itself a request to switch. When the page shows another data source than the ' +
      'active one, the active one was chosen later: keep using it unless the request is about the data on the page. ' +
      'NOTES: (1) A dataset or index-pattern id is not a data source id. ' +
      '(2) Once set, data-source-aware tools use it automatically; do not pass a data source id to them. ' +
      '(3) Call this tool on its own and wait for its result: tools called in the same step still ' +
      'run against the previous data source.',
    parameters: {
      type: 'object',
      properties: {
        dataSourceId: {
          type: 'string',
          description:
            'The id of a data source listed in available-data-sources-context. Must not be a ' +
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

        if (args.dataSourceId === chatService.getConfirmedDataSourceId()) {
          return {
            success: true,
            skipped: true,
            dataSourceId: args.dataSourceId,
            message: `"${args.dataSourceId}" is already the active data source. No switch is needed.`,
          };
        }

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
