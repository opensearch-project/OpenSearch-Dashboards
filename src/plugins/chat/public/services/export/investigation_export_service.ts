/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import html2canvas from 'html2canvas-pro';
import type {
  Message,
  AssistantMessage,
  ToolMessage,
  TextInputContent,
} from '../../../common/types';
import { ChatExportData, ChatExportOptions, ChatTraceStep, CapturedVisualization } from './types';
import { generatePDFReport } from './pdf_template';
import { generateMarkdownReport } from './markdown_template';

/**
 * Collect all data needed for the export from the current timeline.
 *
 * In the chat plugin, the timeline is a flat array of AG-UI Messages.
 * Tool calls are embedded in AssistantMessage.toolCalls, and tool results
 * are separate ToolMessage entries in the timeline.
 */
export async function collectChatExportData(
  timeline: Message[],
  targetMessage: AssistantMessage,
  threadId: string | undefined,
  options: ChatExportOptions
): Promise<ChatExportData> {
  const targetIndex = timeline.findIndex((m) => m.id === targetMessage.id);

  let visualizations: CapturedVisualization[] = [];
  if (options.includeVisualizations) {
    const toolCallIds = getToolCallIdsFromTurn(timeline, targetIndex);
    visualizations = await captureVisualizations(toolCallIds);
  }

  return {
    question: findPrecedingQuestion(timeline, targetIndex),
    answer: targetMessage.content || '',
    traces: options.includeTraces ? extractTraces(timeline, targetIndex) : [],
    visualizations,
    metadata: options.includeMetadata
      ? { timestamp: new Date().toISOString(), threadId }
      : undefined,
    note: options.note,
  };
}

/**
 * Export as PDF: generates HTML report and opens browser print dialog.
 * User saves as PDF from the native print dialog.
 */
export function exportAsPdf(
  data: ChatExportData,
  options: ChatExportOptions,
  printWindow: Window
): void {
  const htmlContent = generatePDFReport(data, options);
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}

/**
 * Export as Markdown: generates markdown and triggers file download.
 */
export function exportAsMarkdown(data: ChatExportData, options: ChatExportOptions): void {
  const content = generateMarkdownReport(data, options);
  const titleSlug = data.question
    .substring(0, 50)
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  const filename = `investigation-report-${titleSlug || 'export'}.md`;

  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Find the user question that precedes the target assistant message.
 * Walks backward through the timeline from the target index.
 * Handles both string content and multimodal content (text + images).
 */
export function findPrecedingQuestion(timeline: Message[], targetIndex: number): string {
  for (let i = targetIndex - 1; i >= 0; i--) {
    const msg = timeline[i];
    if (msg.role === 'user') {
      if (typeof msg.content === 'string') {
        return msg.content;
      }
      if (Array.isArray(msg.content)) {
        return msg.content
          .filter((c): c is TextInputContent => c.type === 'text')
          .map((c) => c.text)
          .join(' ');
      }
      return '';
    }
  }
  return '';
}

/**
 * Extract trace steps from tool calls on the target assistant message
 * and their corresponding tool result messages in the timeline.
 */
export function extractTraces(timeline: Message[], targetIndex: number): ChatTraceStep[] {
  const targetMessage = timeline[targetIndex] as AssistantMessage;
  const toolCalls = targetMessage.toolCalls || [];

  if (!toolCalls.length) {
    return extractTracesFromTurn(timeline, targetIndex);
  }

  // Scope tool result search to the same Q&A turn
  const turnMessages = getTurnMessages(timeline, targetIndex);

  return toolCalls.map((toolCall) => {
    const toolResult = turnMessages.find(
      (msg) => msg.role === 'tool' && (msg as ToolMessage).toolCallId === toolCall.id
    ) as ToolMessage | undefined;

    return {
      toolName: toolCall.function.name,
      arguments: toolCall.function.arguments,
      result: toolResult?.content,
      error: toolResult?.error,
    };
  });
}

/**
 * Get the slice of the timeline that belongs to the same Q&A turn as the target message.
 * A turn starts after the preceding user message and ends before the next user message.
 */
export function getTurnMessages(timeline: Message[], targetIndex: number): Message[] {
  let turnStart = 0;
  for (let i = targetIndex - 1; i >= 0; i--) {
    if (timeline[i].role === 'user') {
      turnStart = i + 1;
      break;
    }
  }

  let turnEnd = timeline.length;
  for (let i = targetIndex + 1; i < timeline.length; i++) {
    if (timeline[i].role === 'user') {
      turnEnd = i;
      break;
    }
  }

  return timeline.slice(turnStart, turnEnd);
}

/**
 * Extract traces from all assistant messages and tool results
 * in the same Q&A turn (between the preceding user message and the next user message).
 */
export function extractTracesFromTurn(timeline: Message[], targetIndex: number): ChatTraceStep[] {
  const turnMessages = getTurnMessages(timeline, targetIndex);
  const traces: ChatTraceStep[] = [];

  for (const msg of turnMessages) {
    if (msg.role === 'assistant') {
      const assistantMsg = msg as AssistantMessage;
      for (const toolCall of assistantMsg.toolCalls || []) {
        const toolResult = turnMessages.find(
          (m) => m.role === 'tool' && (m as ToolMessage).toolCallId === toolCall.id
        ) as ToolMessage | undefined;

        traces.push({
          toolName: toolCall.function.name,
          arguments: toolCall.function.arguments,
          result: toolResult?.content,
          error: toolResult?.error,
        });
      }
    }
  }

  return traces;
}

/**
 * Get all tool call IDs from the same Q&A turn as the target message.
 * Used to scope visualization capture to the correct turn.
 */
export function getToolCallIdsFromTurn(timeline: Message[], targetIndex: number): string[] {
  const turnMessages = getTurnMessages(timeline, targetIndex);
  const ids: string[] = [];

  for (const msg of turnMessages) {
    if (msg.role === 'assistant') {
      const assistantMsg = msg as AssistantMessage;
      for (const toolCall of assistantMsg.toolCalls || []) {
        ids.push(toolCall.id);
      }
    }
  }

  return ids;
}

/**
 * Capture visualization DOM elements as base64 images using html2canvas-pro.
 * Only captures elements whose data-tool-call-id matches the provided IDs.
 */
export async function captureVisualizations(
  toolCallIds: string[]
): Promise<CapturedVisualization[]> {
  if (!toolCallIds.length) return [];

  const nonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content');
  if (nonce) {
    html2canvas.setCspNonce(nonce);
  }

  const results: CapturedVisualization[] = [];

  for (const toolCallId of toolCallIds) {
    const element = document.querySelector(`[data-tool-call-id="${toolCallId}"]`);
    if (!element) continue;

    try {
      const canvas = await html2canvas(element as HTMLElement, {
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });
      const base64 = canvas.toDataURL('image/png').split(',')[1];

      results.push({
        base64,
        mimeType: 'image/png',
        toolCallId,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to capture visualization for tool call ${toolCallId}:`, error);
    }
  }

  return results;
}
