/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiButton,
  EuiButtonEmpty,
  EuiCheckbox,
  EuiSpacer,
  EuiTextArea,
  EuiButtonGroup,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import type { Message, AssistantMessage } from '../../common/types';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { CoreStart } from '../../../../core/public';
import { collectChatExportData, exportAsPdf, exportAsMarkdown } from '../services/export';

interface ShareModalProps {
  onClose: () => void;
  timeline: Message[];
  targetMessage: AssistantMessage;
  threadId: string | undefined;
}

const FORMAT_OPTIONS = [
  {
    id: 'pdf',
    label: i18n.translate('chat.shareModal.formatPdf', { defaultMessage: 'PDF' }),
  },
  {
    id: 'markdown',
    label: i18n.translate('chat.shareModal.formatMarkdown', { defaultMessage: 'Markdown' }),
  },
];

export const ShareModal: React.FC<ShareModalProps> = ({
  onClose,
  timeline,
  targetMessage,
  threadId,
}) => {
  const { services } = useOpenSearchDashboards<{ core: CoreStart }>();
  const toasts = services.core?.notifications?.toasts;
  const [includeAISummary, setIncludeAISummary] = useState(true);
  const [includeTraces, setIncludeTraces] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const [format, setFormat] = useState<'pdf' | 'markdown'>('pdf');
  const [note, setNote] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const nothingSelected = !includeAISummary && !includeTraces && !includeMetadata;

  const handleExport = useCallback(async () => {
    setIsExporting(true);

    // Open the print window synchronously (before any async work) to avoid popup blockers.
    // Browsers block window.open calls that aren't in the same call stack as a user gesture.
    let printWindow: Window | null = null;
    if (format === 'pdf') {
      printWindow = window.open('', '_blank');
      if (!printWindow) {
        toasts?.addDanger({
          title: i18n.translate('chat.shareModal.popupBlocked', {
            defaultMessage: 'Popup blocked',
          }),
          text: i18n.translate('chat.shareModal.popupBlockedText', {
            defaultMessage: 'Please allow popups for this site to export as PDF.',
          }),
        });
        setIsExporting(false);
        return;
      }
    }

    try {
      const options = {
        includeAISummary,
        includeTraces,
        includeMetadata,
        format,
        note: note.trim() || undefined,
      };
      const data = await collectChatExportData(timeline, targetMessage, threadId, options);

      if (format === 'pdf') {
        exportAsPdf(data, options, printWindow!);
      } else {
        exportAsMarkdown(data, options);
      }
      onClose();
    } catch (error) {
      // Close the print window if it was opened but export failed
      printWindow?.close();
      toasts?.addDanger({
        title: i18n.translate('chat.shareModal.exportError', {
          defaultMessage: 'Failed to export report',
        }),
        text: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsExporting(false);
    }
  }, [
    includeAISummary,
    includeTraces,
    includeMetadata,
    format,
    note,
    timeline,
    targetMessage,
    threadId,
    onClose,
    toasts,
  ]);

  return (
    <EuiModal onClose={onClose} style={{ maxWidth: 480 }}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          {i18n.translate('chat.shareModal.title', {
            defaultMessage: 'Share Investigation',
          })}
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <EuiText size="s" color="subdued">
          {i18n.translate('chat.shareModal.description', {
            defaultMessage: 'Export this investigation as a self-contained report anyone can open.',
          })}
        </EuiText>

        <EuiSpacer size="m" />

        <EuiText size="xs">
          <strong>
            {i18n.translate('chat.shareModal.includeLabel', {
              defaultMessage: 'Include in report',
            })}
          </strong>
        </EuiText>
        <EuiSpacer size="s" />

        <EuiCheckbox
          id="share-include-summary"
          label={i18n.translate('chat.shareModal.aiSummary', {
            defaultMessage: 'AI Summary — Investigation question, answer, and key findings',
          })}
          checked={includeAISummary}
          onChange={(e) => setIncludeAISummary(e.target.checked)}
        />
        <EuiSpacer size="xs" />
        <EuiCheckbox
          id="share-include-traces"
          label={i18n.translate('chat.shareModal.traces', {
            defaultMessage: 'Evidence (Agent Traces) — Tool calls, analysis steps, and results',
          })}
          checked={includeTraces}
          onChange={(e) => setIncludeTraces(e.target.checked)}
        />
        <EuiSpacer size="xs" />
        <EuiCheckbox
          id="share-include-metadata"
          label={i18n.translate('chat.shareModal.metadata', {
            defaultMessage: 'Metadata — Timestamp, thread ID',
          })}
          checked={includeMetadata}
          onChange={(e) => setIncludeMetadata(e.target.checked)}
        />

        <EuiSpacer size="m" />

        <EuiText size="xs">
          <strong>
            {i18n.translate('chat.shareModal.formatLabel', {
              defaultMessage: 'Format',
            })}
          </strong>
        </EuiText>
        <EuiSpacer size="s" />
        <EuiButtonGroup
          legend={i18n.translate('chat.shareModal.formatLegend', {
            defaultMessage: 'Export format',
          })}
          options={FORMAT_OPTIONS}
          idSelected={format}
          onChange={(id) => setFormat(id as 'pdf' | 'markdown')}
        />

        <EuiSpacer size="m" />

        <EuiText size="xs">
          <strong>
            {i18n.translate('chat.shareModal.noteLabel', {
              defaultMessage: 'Add a note (optional)',
            })}
          </strong>
        </EuiText>
        <EuiSpacer size="s" />
        <EuiTextArea
          placeholder={i18n.translate('chat.shareModal.notePlaceholder', {
            defaultMessage:
              'e.g., Please investigate the texture cache issue — see crash pattern in the Evidence section',
          })}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          fullWidth
        />
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={onClose} disabled={isExporting}>
          {i18n.translate('chat.shareModal.cancel', { defaultMessage: 'Cancel' })}
        </EuiButtonEmpty>
        <EuiButton onClick={handleExport} fill isLoading={isExporting} disabled={nothingSelected}>
          {isExporting
            ? i18n.translate('chat.shareModal.exporting', { defaultMessage: 'Exporting...' })
            : i18n.translate('chat.shareModal.download', { defaultMessage: 'Download Report' })}
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
