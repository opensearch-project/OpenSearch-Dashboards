/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { useEffect, useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiListGroup,
  EuiListGroupItem,
  EuiLoadingSpinner,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { useAssistantAction } from '../../../context_provider/public';
import { ChatService } from '../services/chat_service';

import { SWITCH_DATA_SOURCE_TOOL_NAME } from '../../common';

interface SwitchDataSourceArgs {
  // from the user's picker confirmation.
  selectedDataSourceId?: string;
  selectedDataSourceTitle?: string;
  reason?: string;
  confirmed?: boolean;
}

interface SwitchDataSourceResult {
  success: boolean;
  dataSourceId?: string;
  datasourceTitle?: string;
  message?: string;
  error?: string;
}

const SwitchDataSourceCard = ({
  status,
  args,
  result,
  chatService,
  onApprove,
  onReject,
}: {
  status: 'running' | 'complete' | 'error';
  args?: SwitchDataSourceArgs;
  result?: SwitchDataSourceResult | string;
  chatService: ChatService;
  onApprove?: (modifiedArgs?: Partial<SwitchDataSourceArgs>) => void;
  onReject?: () => void;
}) => {
  const [availableDataSources, setAvailableDataSources] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [currentDataSource, setCurrentDataSource] = useState<{ id: string; title?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  // Set synchronously the moment the user picks a data source, so the card gives instant
  // feedback instead of waiting for the tool-call status
  const [switchingTo, setSwitchingTo] = useState<{ id: string; title: string }>();

  useEffect(() => {
    if (status !== 'running') {
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      chatService.getAvailableDataSources(),
      chatService.getCurrentDataSourceInfo().catch(() => undefined),
    ])
      .then(([dataSources, current]) => {
        if (cancelled) return;
        setAvailableDataSources(dataSources);
        setCurrentDataSource(current);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [chatService, status]);

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

  const sessionDataSourceIds = chatService.getSessionDataSourceList();
  const selectableDataSources =
    sessionDataSourceIds.length > 0
      ? sessionDataSourceIds.map((id) => {
          const availableDataSource = availableDataSources.find((ds) => ds.id === id);
          const currentTitle = currentDataSource?.id === id ? currentDataSource.title : undefined;
          return {
            id,
            title: availableDataSource?.title ?? currentTitle ?? id,
          };
        })
      : availableDataSources;

  const isSuccess = status === 'complete' && parsedResult?.success !== false;
  const dataSourceId = parsedResult?.dataSourceId;
  const dataSourceTitle = parsedResult?.datasourceTitle;
  const dsLabel = dataSourceTitle || dataSourceId || null;

  if (status === 'running') {
    if (switchingTo) {
      return (
        <EuiPanel hasBorder hasShadow={false} paddingSize="m">
          <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiLoadingSpinner size="s" />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText size="s">
                {i18n.translate('chat.switchDataSource.switching', {
                  defaultMessage: 'Switching to {label}…',
                  values: { label: switchingTo.title },
                })}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      );
    }

    return (
      <EuiPanel hasBorder hasShadow={false} paddingSize="m">
        <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiIcon type="database" size="m" color="primary" />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size="s">
              <strong>
                {i18n.translate('chat.switchDataSource.chooseTitle', {
                  defaultMessage: 'Choose a data source to continue',
                })}
              </strong>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="s" />

        <EuiText size="xs" color="subdued">
          <p>
            {i18n.translate('chat.switchDataSource.chooseBody', {
              defaultMessage:
                'This conversation has used multiple data sources. Select which one to use for the next data-source-aware tools.',
            })}
          </p>
        </EuiText>

        {args?.reason && (
          <>
            <EuiSpacer size="s" />
            <EuiText size="xs" color="subdued">
              <p>
                {i18n.translate('chat.switchDataSource.reasonLabel', {
                  defaultMessage: 'Reason: {reason}',
                  values: { reason: args.reason },
                })}
              </p>
            </EuiText>
          </>
        )}

        {currentDataSource && (
          <>
            <EuiSpacer size="s" />
            <EuiBadge color="hollow">
              {i18n.translate('chat.switchDataSource.currentBadge', {
                defaultMessage: 'Current: {label}',
                values: { label: currentDataSource.title ?? currentDataSource.id },
              })}
            </EuiBadge>
          </>
        )}

        <EuiSpacer size="m" />

        {isLoading ? (
          <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiLoadingSpinner size="m" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="xs" color="subdued">
                {i18n.translate('chat.switchDataSource.loadingOptions', {
                  defaultMessage: 'Loading available data sources…',
                })}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        ) : selectableDataSources.length > 0 ? (
          <EuiListGroup maxWidth={false} flush gutterSize="none">
            {selectableDataSources.map((dataSource) => (
              <EuiListGroupItem
                key={dataSource.id}
                label={dataSource.title}
                iconType="database"
                onClick={() => {
                  setSwitchingTo({ id: dataSource.id, title: dataSource.title });
                  onApprove?.({
                    selectedDataSourceId: dataSource.id,
                    selectedDataSourceTitle: dataSource.title,
                  });
                }}
                size="s"
              />
            ))}
          </EuiListGroup>
        ) : (
          <EuiText size="xs" color="subdued">
            <p>
              {i18n.translate('chat.switchDataSource.noOptions', {
                defaultMessage:
                  'No data sources from this conversation are currently available to choose from.',
              })}
            </p>
          </EuiText>
        )}

        {onReject && (
          <>
            <EuiSpacer size="s" />
            <EuiButtonEmpty size="xs" flush="left" onClick={() => onReject()}>
              {i18n.translate('chat.switchDataSource.cancel', {
                defaultMessage: 'Cancel',
              })}
            </EuiButtonEmpty>
          </>
        )}
      </EuiPanel>
    );
  }

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
        style={{ padding: '2px 0' }}
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

  return (
    <EuiFlexGroup
      alignItems="center"
      gutterSize="xs"
      responsive={false}
      wrap={false}
      style={{ padding: '2px 0' }}
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
 * Registers the switch_data_source tool so the LLM can request a data source switch
 * and the user can make the final selection in the chat UI.
 */
export function useSwitchDataSourceAction(chatService: ChatService, enabled: boolean = true) {
  useAssistantAction<SwitchDataSourceArgs>({
    name: SWITCH_DATA_SOURCE_TOOL_NAME,
    description:
      'Ask the user to choose the active data source for any subsequent data-source-aware tool that inspects fields, queries data, or creates a visualization. ' +
      'You MUST call this tool before any such tool whenever more than one data source has already ' +
      "appeared in this conversation. A previously confirmed data source is only the user's most " +
      'recent choice and does NOT remove this requirement. ' +
      "Do NOT choose a data source on the user's behalf. This tool presents a picker and the user " +
      'makes the final selection. ' +
      'Do NOT ask the user which data source to use in natural language when this tool should be used. ' +
      'After the user confirms a selection, subsequent tools automatically use that data source, ' +
      'so you do not need to pass a data source id to them. ' +
      'The UI will present the data sources already seen in this conversation for the user to choose from.',
    parameters: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description:
            'Optional. Brief explanation shown to the user about why they need to choose a data source ' +
            '(e.g. "the Flights panel uses a different data source").',
        },
      },
      required: [],
    },
    handler: async (args) => {
      try {
        if (args.confirmed !== true) {
          return {
            success: false,
            message: 'Waiting for the user to choose a data source.',
          };
        }

        if (!args.selectedDataSourceId || typeof args.selectedDataSourceId !== 'string') {
          return {
            success: false,
            message: 'The user must choose a data source from the conversation list.',
          };
        }

        // Validate before writing to ChatService
        const { valid, dataSource, availableDataSources } = await chatService.validateDataSourceId(
          args.selectedDataSourceId
        );

        if (!valid) {
          return {
            success: false,
            message:
              `Unknown dataSourceId "${args.selectedDataSourceId}". Valid data source ids are: ` +
              `${availableDataSources.map((ds) => ds.id).join(', ')}. ` +
              'Note that a dataset or index pattern id is not a data source id.',
          };
        }

        chatService.setConfirmedDataSourceId(args.selectedDataSourceId);

        const resolvedTitle = dataSource?.title ?? args.selectedDataSourceTitle;

        return {
          success: true,
          dataSourceId: args.selectedDataSourceId,
          datasourceTitle: resolvedTitle,
          message: `Confirmed "${resolvedTitle ?? args.selectedDataSourceId}" as the active data source for this conversation.`,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to switch data source',
        };
      }
    },
    render: ({ status, args, result, onApprove, onReject }) => {
      const cardStatus =
        status === 'complete' ? 'complete' : status === 'failed' ? 'error' : 'running';
      return (
        <SwitchDataSourceCard
          status={cardStatus}
          args={args}
          result={result}
          chatService={chatService}
          onApprove={onApprove}
          onReject={onReject}
        />
      );
    },
    requiresConfirmation: true,
    useCustomRenderer: true,
    enabled,
  });
}
