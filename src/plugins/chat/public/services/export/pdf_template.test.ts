/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildTraceStepsHtml, generatePDFReport } from './pdf_template';
import { ChatExportData, ChatExportOptions } from './types';

describe('buildTraceStepsHtml', () => {
  it('should return empty section message when no traces', () => {
    const data: ChatExportData = {
      question: 'Q',
      answer: 'A',
      traces: [],
    };
    const result = buildTraceStepsHtml(data);
    expect(result).toContain('No agent traces available');
  });

  it('should render trace steps with tool name, input, and output', () => {
    const data: ChatExportData = {
      question: 'Q',
      answer: 'A',
      traces: [{ toolName: 'SearchTool', arguments: '{"q":"test"}', result: 'Found 10 results' }],
    };
    const result = buildTraceStepsHtml(data);
    expect(result).toContain('SearchTool');
    expect(result).toContain('Input');
    expect(result).toContain('Output');
    expect(result).toContain('Found 10 results');
  });

  it('should render error traces', () => {
    const data: ChatExportData = {
      question: 'Q',
      answer: 'A',
      traces: [{ toolName: 'FailTool', arguments: '{}', error: 'Connection timeout' }],
    };
    const result = buildTraceStepsHtml(data);
    expect(result).toContain('Error');
    expect(result).toContain('Connection timeout');
    expect(result).toContain('error');
  });

  it('should render multiple trace steps with numbering', () => {
    const data: ChatExportData = {
      question: 'Q',
      answer: 'A',
      traces: [
        { toolName: 'ToolA', arguments: '{}', result: 'Result A' },
        { toolName: 'ToolB', arguments: '{}', result: 'Result B' },
      ],
    };
    const result = buildTraceStepsHtml(data);
    expect(result).toContain('>1<');
    expect(result).toContain('>2<');
    expect(result).toContain('ToolA');
    expect(result).toContain('ToolB');
  });

  it('should escape HTML in trace content', () => {
    const data: ChatExportData = {
      question: 'Q',
      answer: 'A',
      traces: [
        { toolName: '<script>alert(1)</script>', arguments: '<b>bold</b>', result: '&amp;' },
      ],
    };
    const result = buildTraceStepsHtml(data);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });
});

describe('generatePDFReport', () => {
  const baseOptions: ChatExportOptions = {
    includeAISummary: true,
    includeTraces: true,
    includeMetadata: true,
    format: 'pdf',
  };

  const baseData: ChatExportData = {
    question: 'What caused the crash?',
    answer: 'Found **3,247** crash events.',
    traces: [{ toolName: 'LogTool', arguments: '{"index":"logs"}', result: '3247 events' }],
    metadata: { timestamp: '2026-04-08T16:42:00Z', threadId: 'thread-123' },
  };

  it('should generate a complete HTML document', () => {
    const result = generatePDFReport(baseData, baseOptions);
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('</html>');
  });

  it('should include the investigation question', () => {
    const result = generatePDFReport(baseData, baseOptions);
    expect(result).toContain('What caused the crash?');
    expect(result).toContain('Investigation Question');
  });

  it('should include AI analysis when enabled', () => {
    const result = generatePDFReport(baseData, baseOptions);
    expect(result).toContain('AI Analysis');
    expect(result).toContain('<strong>3,247</strong>');
  });

  it('should exclude AI analysis when disabled', () => {
    const result = generatePDFReport(baseData, { ...baseOptions, includeAISummary: false });
    expect(result).not.toContain('AI Analysis');
  });

  it('should include traces when enabled', () => {
    const result = generatePDFReport(baseData, baseOptions);
    expect(result).toContain('Evidence');
    expect(result).toContain('LogTool');
  });

  it('should exclude traces when disabled', () => {
    const result = generatePDFReport(
      { ...baseData, traces: [] },
      { ...baseOptions, includeTraces: false }
    );
    expect(result).not.toContain('Evidence');
  });

  it('should include metadata when enabled', () => {
    const result = generatePDFReport(baseData, baseOptions);
    expect(result).toContain('Metadata');
    expect(result).toContain('thread-123');
  });

  it('should exclude metadata when disabled', () => {
    const result = generatePDFReport(baseData, { ...baseOptions, includeMetadata: false });
    expect(result).not.toContain('Metadata');
  });

  it('should include investigator note when provided', () => {
    const data = { ...baseData, note: 'Check the v2.1.3 update' };
    const result = generatePDFReport(data, baseOptions);
    expect(result).toContain('Note from investigator');
    expect(result).toContain('Check the v2.1.3 update');
  });

  it('should not include note section when no note', () => {
    const result = generatePDFReport(baseData, baseOptions);
    expect(result).not.toContain('Note from investigator');
  });

  it('should include print media styles', () => {
    const result = generatePDFReport(baseData, baseOptions);
    expect(result).toContain('@media print');
  });

  it('should include the footer disclaimer', () => {
    const result = generatePDFReport(baseData, baseOptions);
    expect(result).toContain('point-in-time snapshot');
  });

  it('should truncate long titles', () => {
    const longQuestion = 'A'.repeat(100);
    const data = { ...baseData, question: longQuestion };
    const result = generatePDFReport(data, baseOptions);
    expect(result).toContain('A'.repeat(80) + '...');
  });

  it('should escape HTML in question text', () => {
    const data = { ...baseData, question: '<script>alert("xss")</script>' };
    const result = generatePDFReport(data, baseOptions);
    expect(result).not.toContain('<script>alert');
    expect(result).toContain('&lt;script&gt;');
  });

  it('should escape HTML in questionImage mimeType', () => {
    const data = {
      ...baseData,
      questionImage: { base64: 'abc', mimeType: '" onerror="alert(1)' },
    };
    const result = generatePDFReport(data, baseOptions);
    // The " should be escaped to &quot; preventing attribute breakout
    expect(result).not.toContain('" onerror="');
    expect(result).toContain('&quot;');
  });
});
