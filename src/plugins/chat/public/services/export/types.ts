/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChatExportOptions {
  includeAISummary: boolean;
  includeTraces: boolean;
  includeVisualizations: boolean;
  includeMetadata: boolean;
  format: 'pdf' | 'markdown';
  note?: string;
}

export interface ChatTraceStep {
  toolName: string;
  arguments: string;
  result?: string;
  error?: string;
}

export interface CapturedVisualization {
  base64: string;
  mimeType: string;
  toolCallId: string;
}

export interface QuestionImage {
  base64: string;
  mimeType: string;
}

export interface ChatExportData {
  question: string;
  questionImage?: QuestionImage;
  answer: string;
  traces: ChatTraceStep[];
  visualizations: CapturedVisualization[];
  metadata?: {
    timestamp: string;
    threadId?: string;
  };
  note?: string;
}
