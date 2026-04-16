/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { escape } from 'lodash';
import moment from 'moment';
import { ChatExportData, ChatExportOptions } from './types';
import { markdownToHtml } from './markdown_converter';

export function buildTraceStepsHtml(data: ChatExportData): string {
  if (!data.traces.length) {
    return '<p class="empty-section">No agent traces available.</p>';
  }

  return data.traces
    .map(
      (trace, i) => `
      <div class="trace-step">
        <div class="trace-step-header">
          <span class="num">${i + 1}</span>
          <span class="tool">${escape(trace.toolName)}</span>
        </div>
        <div class="trace-step-body">
          ${
            trace.arguments
              ? `<div class="label">Input</div><pre>${escape(trace.arguments)}</pre>`
              : ''
          }
          ${trace.result ? `<div class="label">Output</div><pre>${escape(trace.result)}</pre>` : ''}
          ${
            trace.error
              ? `<div class="label">Error</div><pre class="error">${escape(trace.error)}</pre>`
              : ''
          }
        </div>
      </div>`
    )
    .join('\n');
}

/**
 * Generate a self-contained HTML report for PDF export via browser print dialog.
 *
 * Note: i18n is intentionally not used here. The exported report is a static HTML file
 * opened outside of OSD (by external recipients who don't have OpenSearch access).
 * There is no i18n runtime in the exported file. If localization is needed in the future,
 * strings can be resolved at export time via i18n.translate() and baked into the HTML.
 */
export function generatePDFReport(data: ChatExportData, options: ChatExportOptions): string {
  const title = data.question.length > 80 ? data.question.substring(0, 80) + '...' : data.question;
  const timestamp = data.metadata?.timestamp || new Date().toISOString();
  const formattedDate = moment(timestamp).format('MMMM D, YYYY h:mm A z');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Investigation Report — ${escape(title)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, 'Segoe UI', sans-serif; background: #f8f9fa; color: #1a1b20; line-height: 1.6; }
  .report { max-width: 800px; margin: 0 auto; background: #fff; }
  .report-header { background: linear-gradient(135deg, #0a1628 0%, #162447 100%); color: #fff; padding: 40px 48px 32px; }
  .report-header .badge { display: inline-block; background: rgba(255,255,255,0.15); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 16px; }
  .report-header h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
  .report-header .meta { font-size: 13px; color: rgba(255,255,255,0.6); }
  .report-header .meta span { margin-right: 16px; }
  .report-header .note { margin-top: 16px; padding: 12px 16px; background: rgba(255,255,255,0.08); border-radius: 8px; border-left: 3px solid #5b9bd5; font-size: 13px; color: rgba(255,255,255,0.8); }
  .report-body { padding: 32px 48px 48px; }
  .section { margin-bottom: 32px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #868e96; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e9ecef; }
  .question-box { background: #f1f3f5; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; }
  .question-box .label { font-size: 11px; font-weight: 600; color: #868e96; text-transform: uppercase; margin-bottom: 6px; }
  .question-box .text { font-size: 16px; font-weight: 600; color: #1a1b20; }
  .answer { font-size: 14px; line-height: 1.8; }
  .answer strong { color: #0972d3; }
  .answer code { background: #f1f3f5; padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: 'SF Mono', 'Fira Code', monospace; }
  .answer pre { background: #1a1b20; color: #a9b1d6; padding: 12px 16px; border-radius: 6px; overflow-x: auto; font-size: 12px; line-height: 1.5; margin: 12px 0; }
  .answer pre code { background: none; padding: 0; color: inherit; }
  .answer ul, .answer ol { margin: 12px 0; padding-left: 20px; }
  .answer li { margin-bottom: 6px; }
  .answer table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  .answer th, .answer td { border: 1px solid #e9ecef; padding: 8px 12px; text-align: left; font-size: 13px; }
  .answer th { background: #f1f3f5; font-weight: 600; }
  .answer a { color: #0972d3; text-decoration: none; }
  .answer blockquote { border-left: 3px solid #0972d3; padding-left: 12px; margin: 12px 0; color: #495057; }
  .trace-step { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 8px; overflow: hidden; }
  .trace-step-header { padding: 10px 16px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .trace-step-header .num { background: #0972d3; color: #fff; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; }
  .trace-step-header .tool { color: #5b9bd5; }
  .trace-step-body { padding: 0 16px 12px; font-size: 12px; }
  .trace-step-body pre { background: #1a1b20; color: #a9b1d6; padding: 10px 14px; border-radius: 6px; overflow-x: auto; font-size: 11px; line-height: 1.5; white-space: pre-wrap; }
  .trace-step-body pre.error { border-left: 3px solid #e03131; }
  .trace-step-body .label { font-size: 11px; font-weight: 600; color: #868e96; text-transform: uppercase; margin: 8px 0 4px; }
  .report-footer { padding: 24px 48px; border-top: 1px solid #e9ecef; background: #f8f9fa; }
  .report-footer .powered { font-size: 11px; color: #adb5bd; text-align: center; }
  .empty-section { font-size: 13px; color: #868e96; font-style: italic; }
  @media print {
    @page { margin: 10mm; }
    body { background: #fff; margin: 0; padding: 0; }
    .report { max-width: none; margin: 0; box-shadow: none; }
    .report-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 16px 24px 12px; }
    .report-header h1 { font-size: 18px; }
    .report-body { padding: 16px 24px 24px; }
    .section { margin-bottom: 16px; }
    .trace-step { break-inside: avoid; }
    .section { break-inside: avoid; }
    .report-footer { padding: 12px 24px; }
  }
</style>
</head>
<body>
<div class="report">
  <div class="report-header">
    <div class="badge">OpenSearch Investigation Report</div>
    <h1>${escape(title)}</h1>
    <div class="meta">
      <span>📅 ${escape(formattedDate)}</span>
      ${data.metadata?.threadId ? `<span>💬 ${escape(data.metadata.threadId)}</span>` : ''}
    </div>
    ${
      data.note
        ? `<div class="note"><strong>Note from investigator:</strong> ${escape(data.note)}</div>`
        : ''
    }
  </div>

  <div class="report-body">
    <div class="section">
      <div class="question-box">
        <div class="label">Investigation Question</div>
        <div class="text">${escape(data.question)}</div>
      </div>
    </div>

    ${
      options.includeAISummary
        ? `<div class="section">
      <div class="section-title">AI Analysis</div>
      <div class="answer">${markdownToHtml(data.answer)}</div>
    </div>`
        : ''
    }

    ${
      options.includeVisualizations && data.visualizations.length > 0
        ? `<div class="section">
      <div class="section-title">Visualizations</div>
      ${data.visualizations
        .map(
          (viz) =>
            `<div class="viz-container"><img src="data:${viz.mimeType};base64,${viz.base64}" alt="Visualization" style="max-width:100%;border:1px solid #e9ecef;border-radius:8px;margin-bottom:12px;" /></div>`
        )
        .join('\n')}
    </div>`
        : ''
    }

    ${
      options.includeTraces && data.traces.length > 0
        ? `<div class="section">
      <div class="section-title">Evidence (Agent Investigation Steps)</div>
      ${buildTraceStepsHtml(data)}
    </div>`
        : ''
    }

    ${
      options.includeMetadata && data.metadata
        ? `<div class="section">
      <div class="section-title">Metadata</div>
      <table class="answer">
        <tbody>
          <tr><td><strong>Timestamp</strong></td><td>${escape(formattedDate)}</td></tr>
          ${
            data.metadata.threadId
              ? `<tr><td><strong>Thread ID</strong></td><td>${escape(
                  data.metadata.threadId
                )}</td></tr>`
              : ''
          }
        </tbody>
      </table>
    </div>`
        : ''
    }
  </div>

  <div class="report-footer">
    <div class="powered">
      Generated by OpenSearch AI Investigation • ${escape(
        formattedDate
      )} • This report is a point-in-time snapshot and may not reflect current data.
    </div>
  </div>
</div>
</body>
</html>`;
}
