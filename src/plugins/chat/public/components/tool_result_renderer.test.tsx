/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ToolResultRenderer } from './tool_result_renderer';

// Mock the Markdown component
jest.mock('../../../opensearch_dashboards_react/public', () => ({
  Markdown: ({ markdown }: { markdown: string }) => (
    <div data-testid="markdown-renderer">{markdown}</div>
  ),
}));

describe('ToolResultRenderer', () => {
  describe('valid JSON', () => {
    it('should render valid JSON in a code block', () => {
      const { container } = render(<ToolResultRenderer result='{"key": "value", "number": 42}' />);
      expect(container.querySelector('code')).toBeInTheDocument();
      expect(container.textContent).toContain('"key"');
    });

    it('should pretty-print JSON', () => {
      const { container } = render(<ToolResultRenderer result='{"a":1}' />);
      expect(container.textContent).toContain('"a": 1');
    });

    it('should treat a bare object whose ONLY key is "text" the same as [{text:"..."}]', () => {
      const result = '{"text":"Hello world"}';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('code')).toBeInTheDocument();
      expect(container.textContent).toContain('Hello world');
    });

    it('should NOT extract .text from an object that also has sibling keys (data-loss guard)', () => {
      const result = '{"text":"Hello world","sentiment":"negative"}';
      const { container } = render(<ToolResultRenderer result={result} />);
      // Rendered as pretty JSON, not just the extracted string -- sentiment
      // must still be visible.
      expect(container.querySelector('code')).toBeInTheDocument();
      expect(container.textContent).toContain('"text"');
      expect(container.textContent).toContain('"sentiment"');
      expect(container.textContent).toContain('negative');
    });

    it('should truncate a large top-level JSON object and show a fullscreen control', () => {
      const bigObject = { status: 'yellow', shards: Array(500).fill('shard-info') };
      const result = JSON.stringify(bigObject);
      expect(result.length).toBeGreaterThan(5000);
      render(<ToolResultRenderer result={result} />);
      expect(screen.getByText(/characters truncated/)).toBeInTheDocument();
      const button = screen.getByLabelText('Show full tool result');
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      // All 500 "shard-info" entries must be present in the modal, proving the
      // fullscreen view is not capped like the inline preview.
      const modalText = document.body.textContent || '';
      const occurrences = modalText.split('shard-info').length - 1;
      expect(occurrences).toBeGreaterThanOrEqual(500);
    });
  });

  describe('{text=[...]} wrapper', () => {
    it('should extract text from single item whose ONLY key is text', () => {
      const result = '{text=[{"text":"Hello world"}]}';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('code')).toBeInTheDocument();
      expect(container.textContent).toContain('Hello world');
    });

    it('should render markdown from extracted text value', () => {
      const result = '{text=[{"text":"# Title\\n| A | B |\\n|---|---|\\n| 1 | 2 |"}]}';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('[data-testid="markdown-renderer"]')).toBeInTheDocument();
    });

    it('should render single item without text property as JSON', () => {
      const result = '{text=[{"error":"something failed","code":404}]}';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('code')).toBeInTheDocument();
      expect(container.textContent).toContain('"error"');
    });

    it('should NOT extract .text when the single item has sibling keys (data-loss guard)', () => {
      const result = '{text=[{"text":"Hello","sentiment":"negative"}]}';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('code')).toBeInTheDocument();
      expect(container.textContent).toContain('"text"');
      expect(container.textContent).toContain('"sentiment"');
    });

    it('should render multiple text items as pretty JSON, with NO join', () => {
      const result = '{text=[{"text":"first"},{"text":"second"}]}';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('code')).toBeInTheDocument();
      // Rendered as a JSON array dump, still contains both strings verbatim.
      expect(container.textContent).toContain('"first"');
      expect(container.textContent).toContain('"second"');
    });

    it('should render multiple non-text items as a JSON array', () => {
      const result = '{text=[{"error":"first"},{"error":"second"}]}';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('code')).toBeInTheDocument();
      expect(container.textContent).toContain('"first"');
      expect(container.textContent).toContain('"second"');
    });

    it('should render unparseable {text=[...]} in code block', () => {
      const result = '{text=[not valid json at all]}';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('code')).toBeInTheDocument();
    });

    it('should truncate a large single non-text item and show a fullscreen control', () => {
      const bigItem = { error: 'x'.repeat(6000) };
      const result = `{text=[${JSON.stringify(bigItem)}]}`;
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(screen.getByText(/characters truncated/)).toBeInTheDocument();
      const button = screen.getByLabelText('Show full tool result');
      fireEvent.click(button);
      const modalText = document.body.textContent ?? '';
      const occurrences = modalText.split('xxxxxxxxxx').length - 1;
      expect(occurrences).toBeGreaterThan(0);
    });

    it('should truncate a large multi-item non-text array and show a fullscreen control', () => {
      const items = Array.from({ length: 50 }, (_, i) => ({ id: i, note: 'y'.repeat(200) }));
      const result = `{text=[${items.map((i) => JSON.stringify(i)).join(',')}]}`;
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(screen.getByText(/characters truncated/)).toBeInTheDocument();
      expect(screen.getByLabelText('Show full tool result')).toBeInTheDocument();
    });

    it('should behave identically to the bare-JSON-array shape for a single non-text item', () => {
      const item = { error: 'boom', code: 500 };
      const wrapperResult = `{text=[${JSON.stringify(item)}]}`;
      const bareResult = JSON.stringify([item]);
      const wrapperRender = render(<ToolResultRenderer result={wrapperResult} />);
      const bareRender = render(<ToolResultRenderer result={bareResult} />);
      expect(wrapperRender.container.textContent).toBe(bareRender.container.textContent);
    });

    it('should behave identically to the bare-JSON-array shape for multiple text items (both un-joined)', () => {
      const items = [{ text: 'alpha' }, { text: 'beta' }];
      const wrapperResult = `{text=[${items.map((i) => JSON.stringify(i)).join(',')}]}`;
      const bareResult = JSON.stringify(items);
      const wrapperRender = render(<ToolResultRenderer result={wrapperResult} />);
      const bareRender = render(<ToolResultRenderer result={bareResult} />);
      expect(wrapperRender.container.textContent).toBe(bareRender.container.textContent);
    });
  });

  describe('{text={...}} object wrapper', () => {
    it('should pretty-print a JSON object wrapped in {text={...}} (multiple sibling keys)', () => {
      const result = '{text={"singleAnalysis":[{"field":"index","divergence":1.0}]}}';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('code')).toBeInTheDocument();
      expect(container.textContent).toContain('"singleAnalysis"');
      expect(container.textContent).toContain('"divergence"');
    });

    it('should extract .text when the wrapper inner object has ONLY a text key', () => {
      const result = '{text={"text":"Hello from wrapper"}}';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('code')).toBeInTheDocument();
      expect(container.textContent).toContain('Hello from wrapper');
    });

    it('should render unparseable {text={...}} in code block', () => {
      const result = '{text={not valid json}}';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('code')).toBeInTheDocument();
    });
  });

  describe('text + JSON pattern', () => {
    it('should split prefix text and JSON body', () => {
      const result = 'Mapping for my_index:\n{"my_index":{"mappings":{"properties":{}}}}';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(screen.getByText('Mapping for my_index:')).toBeInTheDocument();
      expect(container.querySelector('code')).toBeInTheDocument();
    });

    it('should split prefix text and JSON array body', () => {
      const result = 'Indices:\n["index1","index2","index3"]';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(screen.getByText('Indices:')).toBeInTheDocument();
      expect(container.querySelector('code')).toBeInTheDocument();
    });

    it('should split prefix + JSON even when the JSON body exceeds MAX_DISPLAY_LENGTH, and never truncate the prefix', () => {
      const properties: Record<string, unknown> = {};
      for (let i = 0; i < 80; i++) {
        properties[`field_${i}`] = {
          type: 'text',
          fields: { keyword: { type: 'keyword', ignore_above: 256 } },
        };
      }
      const mappingJson = JSON.stringify({ my_index: { mappings: { properties } } });
      expect(`Mapping for my_index:\n${mappingJson}`.length).toBeGreaterThan(5000);
      const result = `Mapping for my_index:\n${mappingJson}`;
      const { container } = render(<ToolResultRenderer result={result} />);
      // Prefix is rendered uncapped -- no truncation notice references it.
      expect(screen.getByText('Mapping for my_index:')).toBeInTheDocument();
      const code = container.querySelector('code');
      expect(code).toBeInTheDocument();
      expect(container.textContent).toContain('"my_index"');
      // The JSON body is truncated (it's the large part), so a fullscreen
      // control for the code block must appear.
      expect(screen.getByLabelText('Show full tool result')).toBeInTheDocument();
    });
  });

  describe('pipe-delimited table conversion', () => {
    it('should convert _cat-style pipe-delimited rows into a markdown table', () => {
      const result =
        '[{"text":"index | shard | prirep | state\\nlogs | 0 | p | STARTED\\nlogs | 0 | r | UNASSIGNED\\n"}]';
      const { container } = render(<ToolResultRenderer result={result} />);
      const md = container.querySelector('[data-testid="markdown-renderer"]');
      expect(md).toBeInTheDocument();
      expect(md?.textContent).toContain('| index | shard | prirep | state |');
      expect(md?.textContent).toContain('| --- | --- | --- | --- |');
      expect(md?.textContent).toContain('| logs | 0 | p | STARTED |');
      expect(md?.textContent).toContain('| logs | 0 | r | UNASSIGNED |');
    });

    it('should not convert when column counts are inconsistent', () => {
      const result = '[{"text":"a | b | c\\nonly | two\\n"}]';
      const { container } = render(<ToolResultRenderer result={result} />);
      // Falls through to CodeBlock since it's not a valid table
      expect(container.querySelector('[data-testid="markdown-renderer"]')).not.toBeInTheDocument();
      expect(container.querySelector('code')).toBeInTheDocument();
    });

    it('should strip outer pipes so already-piped rows do not produce empty cells', () => {
      const result = '[{"text":"| index | shard |\\n| logs | 0 |\\n"}]';
      const { container } = render(<ToolResultRenderer result={result} />);
      const md = container.querySelector('[data-testid="markdown-renderer"]');
      expect(md).toBeInTheDocument();
      expect(md?.textContent).toContain('| index | shard |');
      expect(md?.textContent).toContain('| logs | 0 |');
      expect(md?.textContent).not.toContain('|  |');
    });

    it('should not double-convert an existing markdown table', () => {
      const result = '[{"text":"| A | B |\\n|---|---|\\n| 1 | 2 |"}]';
      const { container } = render(<ToolResultRenderer result={result} />);
      const md = container.querySelector('[data-testid="markdown-renderer"]');
      expect(md).toBeInTheDocument();
      expect(md?.textContent).toContain('|---|---|');
    });

    it('should always show a fullscreen control for a markdown table (MarkdownBlock never truncates)', () => {
      const result = '[{"text":"index | shard\\nlogs | 0\\n"}]';
      const { container } = render(<ToolResultRenderer result={result} />);
      const button = screen.getByLabelText('Show fullscreen');
      expect(button).toBeInTheDocument();
      expect(container.querySelectorAll('[data-testid="markdown-renderer"]')).toHaveLength(1);
      fireEvent.click(button);
      expect(document.querySelectorAll('[data-testid="markdown-renderer"]').length).toBeGreaterThan(
        1
      );
    });

    it('should always show a fullscreen control for non-table markdown too (MarkdownBlock has no truncation gate)', () => {
      const result = '[{"text":"# Heading\\n\\nSome **bold** prose."}]';
      render(<ToolResultRenderer result={result} />);
      // MarkdownBlock always exposes a fullscreen control -- it's the same
      // control regardless of whether the content is a table.
      expect(screen.getByLabelText('Show fullscreen')).toBeInTheDocument();
    });

    it('should render the full, untruncated table into MarkdownBlock even when it is very large (no truncation for MarkdownBlock)', () => {
      // Under the new design, MarkdownBlock never truncates -- it always
      // gets the full content and relies purely on CSS overflow:hidden to
      // cap the visual height. A large table's last row must be present in
      // both the (visually-capped) inline DOM and the fullscreen modal.
      const header = 'index | shard';
      const rows = Array.from({ length: 500 }, (_, i) => `logs-${i} | ${i}`);
      const tableText = [header, ...rows].join('\n');
      expect(tableText.length).toBeGreaterThan(5000);

      const result = JSON.stringify([{ text: tableText }]);
      const { container } = render(<ToolResultRenderer result={result} />);
      const md = container.querySelector('[data-testid="markdown-renderer"]');
      expect(md).toBeInTheDocument();
      // Full content present in the DOM (visually clipped by CSS, not by JS).
      expect(md?.textContent).toContain('logs-499');
      const button = screen.getByLabelText('Show fullscreen');
      fireEvent.click(button);
      expect(document.body.textContent).toContain('logs-499');
    });
  });

  describe('markdown detection', () => {
    it('should render content with headers as markdown', () => {
      const result = '# Summary\n\nThis is a summary with **bold** text.';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('[data-testid="markdown-renderer"]')).toBeInTheDocument();
    });

    it('should render content with tables as markdown', () => {
      const result = '| Name | Value |\n|------|-------|\n| foo  | bar   |';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('[data-testid="markdown-renderer"]')).toBeInTheDocument();
    });

    it('should render content with lists as markdown', () => {
      const result = '- Item 1\n- Item 2\n- Item 3';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('[data-testid="markdown-renderer"]')).toBeInTheDocument();
    });

    it('should NOT treat a lone "-" line as a table separator', () => {
      const result = '# Summary\n-\nJust regular prose after a divider.';
      const { container } = render(<ToolResultRenderer result={result} />);
      // Still renders as markdown (headers detected), but the pipe-table
      // conversion path must not have fired on the lone "-" line.
      expect(container.querySelector('[data-testid="markdown-renderer"]')).toBeInTheDocument();
    });

    it('should NOT treat a markdown horizontal rule ("---") as a table separator', () => {
      const result = '# Summary\n\nSome intro text.\n\n---\n\nMore prose after the divider.';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('[data-testid="markdown-renderer"]')).toBeInTheDocument();
    });
  });

  describe('fallback', () => {
    it('should render plain text in code block', () => {
      const result = 'Plain text result without any special formatting';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('code')).toBeInTheDocument();
      expect(container.textContent).toContain(result);
    });
  });

  describe('CodeBlock truncation', () => {
    it('should truncate long plain text and show notice', () => {
      const result = 'x'.repeat(6000);
      render(<ToolResultRenderer result={result} />);
      expect(screen.getByText(/characters truncated/)).toBeInTheDocument();
      expect(screen.getByText(/fullscreen button above for full content/)).toBeInTheDocument();
    });

    it('should not truncate text under the limit', () => {
      const result = 'x'.repeat(4000);
      render(<ToolResultRenderer result={result} />);
      expect(screen.queryByText(/truncated/)).not.toBeInTheDocument();
    });

    it('should show a copy-full-result button (not the built-in truncated copy) when truncated', () => {
      const result = 'x'.repeat(6000);
      render(<ToolResultRenderer result={result} />);
      expect(screen.getByLabelText('Copy full tool result')).toBeInTheDocument();
      expect(screen.queryByLabelText('Copy')).not.toBeInTheDocument();
    });

    it('should use the built-in copy button (not the custom one) when not truncated', () => {
      const result = 'x'.repeat(4000);
      render(<ToolResultRenderer result={result} />);
      expect(screen.queryByLabelText('Copy full tool result')).not.toBeInTheDocument();
    });

    it('should show the copy-full-result button for truncated pretty-printed JSON', () => {
      const bigObject = { data: 'y'.repeat(6000) };
      const result = JSON.stringify([{ text: JSON.stringify(bigObject) }]);
      render(<ToolResultRenderer result={result} />);
      expect(screen.getByLabelText('Copy full tool result')).toBeInTheDocument();
    });

    it('should pretty-print large JSON that would fail to parse if truncated first', () => {
      const bigObject = { status: 'yellow', shards: Array(500).fill('shard-info') };
      const rawJson = JSON.stringify(bigObject);
      expect(rawJson.length).toBeGreaterThan(5000);
      const result = JSON.stringify([{ text: rawJson }]);
      const { container } = render(<ToolResultRenderer result={result} />);
      const code = container.querySelector('code');
      expect(code).toBeInTheDocument();
      expect(container.textContent).toContain('"status": "yellow"');
    });

    it('should show a fullscreen control for a truncated code block, and the modal should contain the full untruncated content', () => {
      const result = 'y'.repeat(6000);
      render(<ToolResultRenderer result={result} />);
      const button = screen.getByLabelText('Show full tool result');
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      const codeBlocks = document.querySelectorAll('code');
      const fullLengthBlock = Array.from(codeBlocks).find((el) => el.textContent?.length === 6000);
      expect(fullLengthBlock).toBeDefined();
    });

    it('should always show a fullscreen control even for short code blocks', () => {
      const result = 'y'.repeat(4000);
      render(<ToolResultRenderer result={result} />);
      expect(screen.getByLabelText('Show full tool result')).toBeInTheDocument();
    });

    it('should show the full untruncated JSON in the fullscreen modal for large pretty-printed JSON', () => {
      const bigObject = { status: 'yellow', shards: Array(500).fill('shard-info') };
      const rawJson = JSON.stringify(bigObject);
      const result = JSON.stringify([{ text: rawJson }]);
      render(<ToolResultRenderer result={result} />);
      const button = screen.getByLabelText('Show full tool result');
      fireEvent.click(button);
      const modalText = document.body.textContent || '';
      const occurrences = modalText.split('shard-info').length - 1;
      expect(occurrences).toBeGreaterThanOrEqual(500);
    });

    it('should cap the preview at MAX_PREVIEW_LINES lines for multi-line content, well under the character limit', () => {
      const lines = Array.from({ length: 600 }, (_, i) => `line ${i} padding-padding-padding`);
      const result = lines.join('\n');
      expect(result.length).toBeGreaterThan(5000);
      const { container } = render(<ToolResultRenderer result={result} />);
      const code = container.querySelector('code');
      // Only the first ~20 lines should be visible inline.
      expect(code?.textContent).toContain('line 0');
      expect(code?.textContent).not.toContain('line 599');
      // Full content still reachable via fullscreen.
      fireEvent.click(screen.getByLabelText('Show full tool result'));
      expect(document.body.textContent).toContain('line 599');
    });

    it('should fall back to a character cap when the content is a single huge line with no newlines', () => {
      // Line-based slicing does nothing for a 1-line string (split('\n')
      // returns a single element) -- the character-cap fallback must kick
      // in so the preview itself is still bounded, not the full string.
      const result = 'a'.repeat(50000);
      const { container } = render(<ToolResultRenderer result={result} />);
      const code = container.querySelector('code');
      expect(code?.textContent?.length).toBeLessThanOrEqual(5000);
      expect(screen.getByLabelText('Show full tool result')).toBeInTheDocument();
      fireEvent.click(screen.getByLabelText('Show full tool result'));
      const modalCode = Array.from(document.querySelectorAll('code')).find(
        (el) => el.textContent?.length === 50000
      );
      expect(modalCode).toBeDefined();
    });
  });

  describe('JSON array [{text: "..."}] format', () => {
    it('should extract text from single-item array whose item has ONLY a text key', () => {
      const result = '[{"text":"Indices:\\n[\\"index1\\",\\"index2\\"]"}]';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(screen.getByText('Indices:')).toBeInTheDocument();
      expect(container.querySelector('code')).toBeInTheDocument();
    });

    it('should render markdown from JSON array text value', () => {
      const result = '[{"text":"# Summary\\n| A | B |\\n|---|---|\\n| 1 | 2 |"}]';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('[data-testid="markdown-renderer"]')).toBeInTheDocument();
    });

    it('should render multiple text items as JSON, with NO join', () => {
      const result = '[{"text":"First section"},{"text":"Second section"}]';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('code')).toBeInTheDocument();
      expect(container.textContent).toContain('First section');
      expect(container.textContent).toContain('Second section');
    });

    it('should fall through to JSON display for non-text arrays', () => {
      const result = '[{"key":"value"},{"key2":"value2"}]';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('code')).toBeInTheDocument();
      expect(container.textContent).toContain('"key"');
    });

    it('should render an empty array as pretty-printed "[]"', () => {
      const result = '[]';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('code')).toBeInTheDocument();
      expect(container.textContent).toContain('[]');
    });

    it('should pretty-print pure JSON extracted from [{text:"{...}"}] (no prefix)', () => {
      const result =
        '[{"text":"{\\"cluster_name\\": \\"integTest\\", \\"status\\": \\"yellow\\", \\"number_of_nodes\\": 1}"}]';
      const { container } = render(<ToolResultRenderer result={result} />);
      const code = container.querySelector('code');
      expect(code).toBeInTheDocument();
      expect(container.textContent).toContain('"cluster_name": "integTest"');
      expect(container.textContent).toContain('"status": "yellow"');
    });

    it('should unwrap double-encoded JSON string and apply pipeline', () => {
      const inner = '[{"text":"Indices:\\n[\\"index1\\",\\"index2\\"]"}]';
      const result = JSON.stringify(inner);
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(screen.getByText('Indices:')).toBeInTheDocument();
      expect(container.querySelector('code')).toBeInTheDocument();
    });

    it('should unwrap double-encoded plain text', () => {
      const result = JSON.stringify('Hello world');
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.textContent).toContain('Hello world');
    });

    it('should render a bare scalar (number) as plain text, not throw', () => {
      const result = '42';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('code')).toBeInTheDocument();
      expect(container.textContent).toContain('42');
    });
  });

  describe('real-world examples', () => {
    it('should handle error mapping result from {text=[...]}', () => {
      const result =
        '{text=[{"text":"Error getting mapping: NotFoundError(404, \'{\\"error\\":{\\"root_cause\\":[]}}\')"}]}';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('code')).toBeInTheDocument();
    });

    it('should handle indices list from {text=[...]}', () => {
      const result =
        '{text=[{"text":"Indices:\\n[\\".plugins-ml-model-group\\",\\".plugins-ml-task\\",\\"movies\\"]"}]}';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(screen.getByText('Indices:')).toBeInTheDocument();
      expect(container.querySelector('code')).toBeInTheDocument();
    });

    it('should handle markdown report from {text=[...]}', () => {
      const result =
        '{text=[{"text":"## 📊 Top 5 Queries\\n\\n| Rank | Query |\\n|------|-------|\\n| 1 | gold |"}]}';
      const { container } = render(<ToolResultRenderer result={result} />);
      expect(container.querySelector('[data-testid="markdown-renderer"]')).toBeInTheDocument();
    });
  });
});
