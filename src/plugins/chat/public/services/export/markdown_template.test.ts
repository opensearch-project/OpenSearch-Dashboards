/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateMarkdownReport } from './markdown_template';
import { ChatExportData, ChatExportOptions } from './types';

describe('generateMarkdownReport', () => {
  const baseOptions: ChatExportOptions = {
    includeAISummary: true,
    includeTraces: true,
    includeVisualizations: false,
    includeMetadata: true,
    format: 'markdown',
  };

  const baseData: ChatExportData = {
    question: 'What caused the crash?',
    answer: 'Found **3,247** crash events.',
    traces: [{ toolName: 'LogTool', arguments: '{"index":"logs"}', result: '3247 events' }],
    visualizations: [],
    metadata: { timestamp: '2026-04-08T16:42:00Z', threadId: 'thread-123' },
  };

  it('should include the question as heading', () => {
    const result = generateMarkdownReport(baseData, baseOptions);
    expect(result).toContain('# Investigation Report — What caused the crash?');
  });

  it('should include the investigation question section', () => {
    const result = generateMarkdownReport(baseData, baseOptions);
    expect(result).toContain('## Investigation Question');
    expect(result).toContain('What caused the crash?');
  });

  it('should include AI analysis when enabled', () => {
    const result = generateMarkdownReport(baseData, baseOptions);
    expect(result).toContain('## AI Analysis');
    expect(result).toContain('Found **3,247** crash events.');
  });

  it('should exclude AI analysis when disabled', () => {
    const result = generateMarkdownReport(baseData, { ...baseOptions, includeAISummary: false });
    expect(result).not.toContain('## AI Analysis');
  });

  it('should include traces when enabled', () => {
    const result = generateMarkdownReport(baseData, baseOptions);
    expect(result).toContain('## Evidence');
    expect(result).toContain('### Step 1 — LogTool');
    expect(result).toContain('{"index":"logs"}');
    expect(result).toContain('3247 events');
  });

  it('should exclude traces when disabled', () => {
    const result = generateMarkdownReport(baseData, { ...baseOptions, includeTraces: false });
    expect(result).not.toContain('## Evidence');
  });

  it('should include metadata when enabled', () => {
    const result = generateMarkdownReport(baseData, baseOptions);
    expect(result).toContain('## Metadata');
    expect(result).toContain('thread-123');
  });

  it('should exclude metadata when disabled', () => {
    const result = generateMarkdownReport(baseData, { ...baseOptions, includeMetadata: false });
    expect(result).not.toContain('## Metadata');
  });

  it('should include note as blockquote when provided', () => {
    const data = { ...baseData, note: 'Check the v2.1.3 update' };
    const result = generateMarkdownReport(data, baseOptions);
    expect(result).toContain('> **Note from investigator:** Check the v2.1.3 update');
  });

  it('should include trace errors', () => {
    const data: ChatExportData = {
      ...baseData,
      traces: [{ toolName: 'FailTool', arguments: '{}', error: 'timeout' }],
    };
    const result = generateMarkdownReport(data, baseOptions);
    expect(result).toContain('**Error:**');
    expect(result).toContain('timeout');
  });

  it('should include footer disclaimer', () => {
    const result = generateMarkdownReport(baseData, baseOptions);
    expect(result).toContain('point-in-time snapshot');
  });

  it('should include thread ID in header when available', () => {
    const result = generateMarkdownReport(baseData, baseOptions);
    expect(result).toContain('**Thread ID:** thread-123');
  });
});
