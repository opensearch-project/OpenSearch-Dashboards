/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiTitle,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadge,
  EuiHealth,
  EuiCodeBlock,
  EuiPanel,
  EuiLink,
  EuiButtonIcon,
  EuiCopy,
  EuiAccordion,
} from '@elastic/eui';

import { TraceRow } from '../hooks/tree_utils';
import { TreeNode } from './tree_helpers';
import {
  CopyContentButton,
  MessageContent,
  MessageViewMode,
  MessageViewModeToggle,
  copyTextFor,
  toDisplayMessages,
} from './message_content_view';
import { previewSpanInput, previewSpanOutput } from '../hooks/genai_message_preview';
import './message_content_view.scss';
import { GenAiAttributes } from './genai_attributes';
import { SpanLogsTab } from '../../../../../../explore/public';
import { TraceLogs, useSpanLogs } from './use_trace_logs';
import { TraceLogsNotices } from './trace_logs_notices';

export const formatJsonOrString = (value: string | undefined): string => {
  if (!value || value === '—')
    return i18n.translate('agentTraces.detailPanel.noData', {
      defaultMessage: '(no data)',
    });
  try {
    const parsed = JSON.parse(value);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return value;
  }
};

const NO_TRACE_LOGS: TraceLogs = {
  logDatasets: [],
  datasetLogs: {},
  logCount: 0,
  isLoading: false,
  errors: [],
  cappedDatasetIds: [],
};

interface FlyoutDetailPanelProps {
  selectedNode: TreeNode | undefined;
  selectedTraceRow: TraceRow | undefined;
  onSelectNode: (nodeId: string) => void;
  /** The trace's correlated logs; the selected span's logs are listed when present. */
  traceLogs?: TraceLogs;
}

export const FlyoutDetailPanel: React.FC<FlyoutDetailPanelProps> = ({
  selectedNode,
  selectedTraceRow,
  onSelectNode,
  traceLogs,
}) => {
  const [ioMode, setIoMode] = useState<MessageViewMode>('formatted');
  const spanDatasetLogs = useSpanLogs(
    traceLogs ?? NO_TRACE_LOGS,
    selectedTraceRow?.traceId ?? '',
    selectedTraceRow?.spanId
  );
  const spanLogCount = Object.values(spanDatasetLogs).reduce((sum, l) => sum + l.length, 0);

  const row = selectedTraceRow;

  // Message attributes first; execute_tool spans fall back to gen_ai.tool.call.* (semconv).
  const ioSection = (value: unknown, toolPreview: string) =>
    toDisplayMessages(value).length > 0 || !toolPreview
      ? { value, formattedText: undefined }
      : { value: toolPreview, formattedText: toolPreview };
  const ioInput = ioSection(row?.input, row ? previewSpanInput(row) : '');
  const ioOutput = ioSection(row?.output, row ? previewSpanOutput(row) : '');

  return (
    <EuiPanel
      color="subdued"
      hasShadow={false}
      borderRadius="none"
      className="agentTracesFlyout__detailPanel"
    >
      <EuiSpacer size="s" />

      <EuiFlexGroup alignItems="flexStart" gutterSize="s" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiTitle size="s">
            <h3 style={{ wordBreak: 'break-word' }}>{selectedNode?.label || '—'}</h3>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiHealth color={row?.status === 'error' ? 'danger' : 'success'}>
            {row?.status === 'error'
              ? i18n.translate('agentTraces.detailPanel.statusError', {
                  defaultMessage: 'Error',
                })
              : i18n.translate('agentTraces.detailPanel.statusSuccess', {
                  defaultMessage: 'Success',
                })}
          </EuiHealth>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      <EuiAccordion
        id="metadata-accordion"
        buttonContent={
          <strong>
            {i18n.translate('agentTraces.detailPanel.metadata', {
              defaultMessage: 'Metadata',
            })}
          </strong>
        }
        initialIsOpen
        paddingSize="m"
      >
        <EuiFlexGroup gutterSize="s" wrap responsive={false} alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiBadge color="hollow">
              <span className="euiTextColor--subdued">
                {i18n.translate('agentTraces.detailPanel.operation', {
                  defaultMessage: 'Operation:',
                })}
              </span>{' '}
              <strong>{row?.kind || '—'}</strong>
            </EuiBadge>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiBadge color="hollow">
              <span className="euiTextColor--subdued">
                {i18n.translate('agentTraces.detailPanel.duration', {
                  defaultMessage: 'Duration:',
                })}
              </span>{' '}
              <strong>{row?.latency || '—'}</strong>
            </EuiBadge>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiBadge color="hollow">
                  <span className="euiTextColor--subdued">
                    {i18n.translate('agentTraces.detailPanel.spanId', {
                      defaultMessage: 'Span ID:',
                    })}
                  </span>{' '}
                  <strong>{row?.spanId || '—'}</strong>
                </EuiBadge>
              </EuiFlexItem>
              {row?.spanId && (
                <EuiFlexItem grow={false}>
                  <EuiCopy textToCopy={row.spanId}>
                    {(copy) => (
                      <EuiButtonIcon
                        size="xs"
                        iconType="copy"
                        onClick={copy}
                        aria-label={i18n.translate('agentTraces.detailPanel.copySpanId', {
                          defaultMessage: 'Copy span ID',
                        })}
                      />
                    )}
                  </EuiCopy>
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiBadge color="hollow">
                  <span className="euiTextColor--subdued">
                    {i18n.translate('agentTraces.detailPanel.parentSpan', {
                      defaultMessage: 'Parent span:',
                    })}
                  </span>{' '}
                  {row?.parentSpanId ? (
                    <strong>
                      <EuiLink onClick={() => onSelectNode(row.parentSpanId!)}>
                        {row.parentSpanId}
                      </EuiLink>
                    </strong>
                  ) : (
                    <span className="euiTextColor--subdued">
                      {i18n.translate('agentTraces.detailPanel.rootSpan', {
                        defaultMessage: 'Root span',
                      })}
                    </span>
                  )}
                </EuiBadge>
              </EuiFlexItem>
              {row?.parentSpanId && (
                <EuiFlexItem grow={false}>
                  <EuiCopy textToCopy={row.parentSpanId}>
                    {(copy) => (
                      <EuiButtonIcon
                        size="xs"
                        iconType="copy"
                        onClick={copy}
                        aria-label={i18n.translate('agentTraces.detailPanel.copyParentSpanId', {
                          defaultMessage: 'Copy parent span ID',
                        })}
                      />
                    )}
                  </EuiCopy>
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiBadge color="hollow">
              <span className="euiTextColor--subdued">
                {i18n.translate('agentTraces.detailPanel.startTime', {
                  defaultMessage: 'Start time:',
                })}
              </span>{' '}
              <strong>{row?.startTime || '—'}</strong>
            </EuiBadge>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiBadge color="hollow">
              <span className="euiTextColor--subdued">
                {i18n.translate('agentTraces.detailPanel.endTime', {
                  defaultMessage: 'End time:',
                })}
              </span>{' '}
              <strong>{row?.endTime || '—'}</strong>
            </EuiBadge>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiAccordion>

      <EuiSpacer size="s" />

      <EuiAccordion
        id="io-accordion"
        buttonContent={
          <strong>
            {i18n.translate('agentTraces.detailPanel.inputOutput', {
              defaultMessage: 'Input / Output',
            })}
          </strong>
        }
        extraAction={
          <MessageViewModeToggle mode={ioMode} onChange={setIoMode} idPrefix="agentTracesIo" />
        }
        initialIsOpen
        paddingSize="m"
      >
        {(
          [
            {
              key: 'input',
              label: i18n.translate('agentTraces.detailPanel.input', { defaultMessage: 'INPUT' }),
              copyLabel: i18n.translate('agentTraces.detailPanel.copyInput', {
                defaultMessage: 'Copy input',
              }),
              value: ioInput.value,
              formattedText: ioInput.formattedText,
            },
            {
              key: 'output',
              label: i18n.translate('agentTraces.detailPanel.output', { defaultMessage: 'OUTPUT' }),
              copyLabel: i18n.translate('agentTraces.detailPanel.copyOutput', {
                defaultMessage: 'Copy output',
              }),
              value: ioOutput.value,
              formattedText: ioOutput.formattedText,
            },
          ] as const
        ).map((section, i) => (
          <div key={section.key}>
            {i > 0 && <EuiSpacer size="m" />}
            <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiTitle size="xxs">
                  <span>{section.label}</span>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <CopyContentButton
                  text={copyTextFor(section.value, ioMode, section.formattedText)}
                  label={section.copyLabel}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="xs" />
            <div data-test-subj={`agentTracesIo-${section.key}`}>
              <MessageContent
                value={section.value}
                mode={ioMode}
                formattedText={section.formattedText}
              />
            </div>
          </div>
        ))}
      </EuiAccordion>

      <EuiSpacer size="s" />

      <EuiAccordion
        id="genai-attributes-accordion"
        buttonContent={
          <strong>
            {i18n.translate('agentTraces.detailPanel.genAiAttributes', {
              defaultMessage: 'GenAI attributes',
            })}
          </strong>
        }
        paddingSize="m"
        data-test-subj="agentTracesGenAiAttributesAccordion"
      >
        <GenAiAttributes doc={row?.rawDocument} />
      </EuiAccordion>

      <EuiSpacer size="s" />

      {traceLogs &&
        (traceLogs.isLoading ||
          traceLogs.logDatasets.length > 0 ||
          traceLogs.errors.length > 0) && (
          <>
            <EuiAccordion
              id="spanLogsAccordion"
              buttonContent={
                <strong>
                  {i18n.translate('agentTraces.detailPanel.logs', {
                    defaultMessage: 'Logs',
                  })}
                </strong>
              }
              extraAction={
                traceLogs.isLoading ? undefined : (
                  <EuiBadge color="hollow" data-test-subj="agentTracesSpanLogsCount">
                    {spanLogCount}
                  </EuiBadge>
                )
              }
              paddingSize="s"
              data-test-subj="agentTracesSpanLogsAccordion"
            >
              <TraceLogsNotices traceLogs={traceLogs} />
              <SpanLogsTab
                traceId={selectedTraceRow?.traceId || ''}
                spanId={selectedTraceRow?.spanId || ''}
                logDatasets={traceLogs.logDatasets}
                datasetLogs={spanDatasetLogs}
                isLoading={traceLogs.isLoading}
                traceDataset={traceLogs.traceDataset ?? undefined}
              />
            </EuiAccordion>
            <EuiSpacer size="s" />
          </>
        )}

      <EuiAccordion
        id="raw-span-accordion"
        buttonContent={
          <strong>
            {i18n.translate('agentTraces.detailPanel.rawSpan', {
              defaultMessage: 'Raw Span',
            })}
          </strong>
        }
        paddingSize="m"
      >
        <EuiCodeBlock language="json" overflowHeight={600} isCopyable>
          {JSON.stringify(selectedTraceRow?.rawDocument ?? {}, null, 2)}
        </EuiCodeBlock>
      </EuiAccordion>
    </EuiPanel>
  );
};
