/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiTitle,
  EuiText,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiCodeBlock,
  EuiPanel,
  EuiLink,
  EuiButtonIcon,
  EuiCopy,
  EuiAccordion,
} from '@elastic/eui';

import { TraceRow } from '../hooks/use_agent_traces';
import { TreeNode } from './tree_helpers';

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

const FieldGrid: React.FC<{
  items: Array<{ label: string; value: React.ReactNode }>;
}> = ({ items }) => {
  const leftItems = items.filter((_, i) => i % 2 === 0);
  const rightItems = items.filter((_, i) => i % 2 !== 0);
  const rowCount = Math.max(leftItems.length, rightItems.length);

  return (
    <>
      {Array.from({ length: rowCount }).map((_, i) => (
        <EuiFlexGroup key={i} gutterSize="l" responsive={false}>
          <EuiFlexItem>
            {leftItems[i] && (
              <div className="agentTracesFlyout__field">
                <EuiText size="xs" color="subdued">
                  {leftItems[i].label}
                </EuiText>
                <EuiText size="s">{leftItems[i].value}</EuiText>
              </div>
            )}
          </EuiFlexItem>
          <EuiFlexItem>
            {rightItems[i] && (
              <div className="agentTracesFlyout__field">
                <EuiText size="xs" color="subdued">
                  {rightItems[i].label}
                </EuiText>
                <EuiText size="s">{rightItems[i].value}</EuiText>
              </div>
            )}
          </EuiFlexItem>
        </EuiFlexGroup>
      ))}
    </>
  );
};

interface FlyoutDetailPanelProps {
  selectedNode: TreeNode | undefined;
  selectedTraceRow: TraceRow | undefined;
  onSelectNode: (nodeId: string) => void;
}

export const FlyoutDetailPanel: React.FC<FlyoutDetailPanelProps> = ({
  selectedNode,
  selectedTraceRow,
  onSelectNode,
}) => {
  const row = selectedTraceRow;

  const metadataFields = [
    {
      label: i18n.translate('agentTraces.detailPanel.operation', {
        defaultMessage: 'OPERATION',
      }),
      value: row?.kind || '—',
    },
    {
      label: i18n.translate('agentTraces.detailPanel.duration', {
        defaultMessage: 'DURATION',
      }),
      value: row?.latency || '—',
    },
    {
      label: i18n.translate('agentTraces.detailPanel.spanId', {
        defaultMessage: 'SPAN ID',
      }),
      value: row?.spanId ? (
        <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiText size="s">
              <code>{row.spanId}</code>
            </EuiText>
          </EuiFlexItem>
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
        </EuiFlexGroup>
      ) : (
        '—'
      ),
    },
    {
      label: i18n.translate('agentTraces.detailPanel.parentSpan', {
        defaultMessage: 'PARENT SPAN',
      }),
      value: row?.parentSpanId ? (
        <EuiLink onClick={() => onSelectNode(row.parentSpanId!)}>{row.parentSpanId}</EuiLink>
      ) : (
        i18n.translate('agentTraces.detailPanel.rootSpan', {
          defaultMessage: '(root span)',
        })
      ),
    },
    {
      label: i18n.translate('agentTraces.detailPanel.status', {
        defaultMessage: 'STATUS',
      }),
      value: (
        <EuiHealth color={row?.status === 'success' ? 'success' : 'danger'}>
          {row?.status === 'success'
            ? i18n.translate('agentTraces.detailPanel.statusOk', {
                defaultMessage: 'OK',
              })
            : i18n.translate('agentTraces.detailPanel.statusError', {
                defaultMessage: 'ERROR',
              })}
        </EuiHealth>
      ),
    },
    {
      label: i18n.translate('agentTraces.detailPanel.tokensUsed', {
        defaultMessage: 'TOKENS USED',
      }),
      value: row?.totalTokens && row.totalTokens !== '—' ? String(row.totalTokens) : '—',
    },
    {
      label: i18n.translate('agentTraces.detailPanel.startTime', {
        defaultMessage: 'START TIME',
      }),
      value: row?.startTime || '—',
    },
    {
      label: i18n.translate('agentTraces.detailPanel.endTime', {
        defaultMessage: 'END TIME',
      }),
      value: row?.endTime || '—',
    },
  ];

  return (
    <EuiPanel
      color="subdued"
      hasShadow={false}
      borderRadius="none"
      className="agentTracesFlyout__detailPanel"
    >
      <EuiTitle size="s">
        <h3>{selectedNode?.label || '—'}</h3>
      </EuiTitle>

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
        <FieldGrid items={metadataFields} />
      </EuiAccordion>

      <EuiSpacer size="m" />

      <EuiAccordion
        id="io-accordion"
        buttonContent={
          <strong>
            {i18n.translate('agentTraces.detailPanel.inputOutput', {
              defaultMessage: 'Input / Output',
            })}
          </strong>
        }
        initialIsOpen
        paddingSize="m"
      >
        <div>
          <EuiTitle size="xxs">
            <span>
              {i18n.translate('agentTraces.detailPanel.input', {
                defaultMessage: 'INPUT',
              })}
            </span>
          </EuiTitle>
          <EuiSpacer size="xs" />
          <EuiCodeBlock
            language="json"
            overflowHeight={200}
            isCopyable={!!row?.input && row.input !== '—'}
          >
            {formatJsonOrString(row?.input)}
          </EuiCodeBlock>
        </div>

        <EuiSpacer size="m" />

        <div>
          <EuiTitle size="xxs">
            <span>
              {i18n.translate('agentTraces.detailPanel.output', {
                defaultMessage: 'OUTPUT',
              })}
            </span>
          </EuiTitle>
          <EuiSpacer size="xs" />
          <EuiCodeBlock
            language="json"
            overflowHeight={200}
            isCopyable={!!row?.output && row.output !== '—'}
          >
            {formatJsonOrString(row?.output)}
          </EuiCodeBlock>
        </div>
      </EuiAccordion>

      <EuiSpacer size="m" />

      <EuiAccordion
        id="raw-span-accordion"
        buttonContent={
          <strong>
            {i18n.translate('agentTraces.detailPanel.rawSpan', {
              defaultMessage: 'Raw Span',
            })}
          </strong>
        }
        initialIsOpen
        paddingSize="m"
      >
        <EuiCodeBlock language="json" overflowHeight={600} isCopyable>
          {JSON.stringify(selectedTraceRow?.rawDocument ?? {}, null, 2)}
        </EuiCodeBlock>
      </EuiAccordion>
    </EuiPanel>
  );
};
