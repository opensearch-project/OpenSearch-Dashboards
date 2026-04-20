/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  Message,
  AssistantMessage,
  ToolMessage,
  TextInputContent,
} from '../../../common/types';
import { ChatExportData, ChatExportOptions, ChatTraceStep, QuestionImage } from './types';
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
  const { text: question, image: questionImage } = findPrecedingQuestion(timeline, targetIndex);

  return {
    question,
    questionImage,
    answer: targetMessage.content || '',
    traces: options.includeTraces ? extractTraces(timeline, targetIndex) : [],
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
 * Returns the text question and optionally a binary image (e.g., from "Ask AI" on a visualization).
 */
export function findPrecedingQuestion(
  timeline: Message[],
  targetIndex: number
): { text: string; image?: QuestionImage } {
  for (let i = targetIndex - 1; i >= 0; i--) {
    const msg = timeline[i];
    if (msg.role === 'user') {
      if (typeof msg.content === 'string') {
        return { text: msg.content };
      }
      if (Array.isArray(msg.content)) {
        const text = msg.content
          .filter((c): c is TextInputContent => c.type === 'text')
          .map((c) => c.text)
          .join(' ');
        const binaryContent = msg.content.find((c) => c.type === 'binary' && 'data' in c);
        const image =
          binaryContent && binaryContent.type === 'binary' && binaryContent.data
            ? { base64: binaryContent.data, mimeType: binaryContent.mimeType || 'image/png' }
            : undefined;
        return { text, image };
      }
      return { text: '' };
    }
  }
  return { text: '' };
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
