/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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

      <EuiSpacer size="s" />

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
