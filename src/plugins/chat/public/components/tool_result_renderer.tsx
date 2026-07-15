/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiCodeBlock,
  EuiText,
  EuiSpacer,
  EuiButtonIcon,
  EuiCopy,
  EuiModal,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { Markdown } from '../../../opensearch_dashboards_react/public';
import './tool_result_renderer.scss';

/**
 * Max characters shown inline before `CodeBlock` truncates and shows a
 * "view full result" control instead. This bounds the DOM/tokenizer cost of
 * EuiCodeBlock's syntax highlighter, which creates one DOM node per
 * token/element — very large content can freeze the tab. It is NOT about
 * our own string-parsing cost (cheap even for large text). Truncation lives
 * ONLY inside `CodeBlock`: every other function in this file (`renderContent`,
 * `renderExtractedText`, `MarkdownBlock`) always passes/receives the
 * complete, untruncated content. The fullscreen modal always shows the
 * complete result on demand, uncapped.
 */
const MAX_DISPLAY_LENGTH = 5000;

/** Height cap (px) for both CodeBlock's overflowHeight and MarkdownBlock's capped preview. */
const PREVIEW_MAX_HEIGHT = 200;

/** Approximate px per code line at the fontSize used here; used only to size MAX_PREVIEW_LINES. */
const LINE_HEIGHT = 10;

/** Number of lines shown in CodeBlock's truncated preview before falling back to a char cap. */
const MAX_PREVIEW_LINES = Math.floor(PREVIEW_MAX_HEIGHT / LINE_HEIGHT);

/**
 * Result of a wrapper-pattern parse: `matched` is true iff the text matched
 * the wrapper's shape (regardless of whether the captured content parsed as
 * JSON), so callers can distinguish "didn't look like this wrapper" from
 * "looked like this wrapper but the JSON inside was malformed" without
 * re-running the pattern themselves.
 */
type WrapperParseResult<T> = { matched: false } | { matched: true; value: T | null };

/**
 * Parses a Java-style `{text=[...]}` wrapper into a JSON array.
 */
const parseTextArrayWrapper = (text: string): WrapperParseResult<any[]> => {
  const match = text.match(/^\{text=\[(.*)\]\}$/s);
  if (!match) return { matched: false };
  try {
    return { matched: true, value: JSON.parse(`[${match[1]}]`) };
  } catch {
    return { matched: true, value: null };
  }
};

/**
 * Parses a Java-style `{text={...}}` wrapper (a Java Map holding an object)
 * into a JSON object, e.g. `{text={"key":[...]}}`.
 */
const parseTextObjectWrapper = (text: string): WrapperParseResult<object> => {
  const match = text.match(/^\{text=(\{.*\})\}$/s);
  if (!match) return { matched: false };
  try {
    return { matched: true, value: JSON.parse(match[1]) };
  } catch {
    return { matched: true, value: null };
  }
};

/**
 * True if `obj` is a plain object (not an array) whose ONLY key is `text`,
 * with a string value. Deliberately strict — NOT just "has a `.text`
 * string" — so an object with sibling keys (e.g.
 * `{text: "...", sentiment: "negative"}`) is excluded: extracting only
 * `.text` from it would silently drop `sentiment` and any other fields.
 * Objects with sibling keys are routed to `CodeBlock json` instead, so no
 * data is ever lost.
 */
const isSoleTextObject = (obj: unknown): obj is { text: string } =>
  typeof obj === 'object' &&
  obj !== null &&
  !Array.isArray(obj) &&
  Object.keys(obj).length === 1 &&
  typeof (obj as Record<string, unknown>).text === 'string';

/** True if text has any markdown syntax worth rendering (header, table, list, quote, code fence). */
const hasMarkdownFeatures = (text: string): boolean => {
  return /^#{1,6}\s|\|.+\|.+\||^[-*]\s|^>\s|```/m.test(text);
};

/**
 * True if a line is a GFM table separator row, e.g. "|---|---|". Requires a
 * pipe (a GFM delimiter row separates cells) and at least two dashes, so a
 * markdown horizontal rule ("---", "----") or a lone "-" (a list bullet or
 * divider) isn't mistaken for one.
 */
const isSeparatorRow = (line: string): boolean =>
  /--/.test(line) && /\|/.test(line) && /^[\s|:-]+$/.test(line);

/**
 * Converts a plain pipe-delimited table (e.g. `_cat` API output, no
 * separator row) into a GFM markdown table. Returns null if the text isn't a
 * clean table: fewer than 2 rows, a line without a pipe, already has a
 * separator row, or rows have inconsistent column counts.
 */
const convertPipeDelimitedTable = (text: string): string | null => {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return null;
  if (!lines.every((l) => l.includes('|'))) return null;
  if (lines.some(isSeparatorRow)) return null;

  // Drop a leading/trailing "|" before splitting so already-piped rows
  // (e.g. "| a | b |") don't produce extra empty cells.
  const stripOuterPipes = (l: string): string => l.replace(/^\|/, '').replace(/\|$/, '').trim();
  const rows = lines.map((l) =>
    stripOuterPipes(l)
      .split('|')
      .map((c) => c.trim())
  );
  const colCount = rows[0].length;
  if (colCount < 2 || !rows.every((r) => r.length === colCount)) return null;

  // Escape any literal "|" left in a cell so it doesn't break the GFM table.
  const escapeCell = (c: string): string => c.replace(/\|/g, '\\|');
  const header = `| ${rows[0].map(escapeCell).join(' | ')} |`;
  const separator = `| ${rows[0].map(() => '---').join(' | ')} |`;
  const body = rows
    .slice(1)
    .map((r) => `| ${r.map(escapeCell).join(' | ')} |`)
    .join('\n');
  return `${header}\n${separator}\n${body}`;
};

/**
 * Splits "descriptive text\n{json}" into [prefix, json]. Returns null if the
 * text doesn't end in a parseable JSON object/array after a newline.
 */
const splitTextAndJson = (text: string): [string, string] | null => {
  const match = text.match(/^([\s\S]+?\n)(\{[\s\S]*\}|\[[\s\S]*\])$/);
  if (!match) return null;
  const jsonCandidate = match[2];
  try {
    JSON.parse(jsonCandidate);
    return [match[1].trim(), jsonCandidate];
  } catch {
    return null;
  }
};

/** Parses JSON, returning null instead of throwing on failure. */
const tryParseJSON = (text: string): any | null => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

interface ToolResultRendererProps {
  result: string;
}

/**
 * Renders markdown inside a height-capped container with a fullscreen
 * control. Unlike `CodeBlock`, `MarkdownBlock` never truncates its content
 * — the full markdown is always rendered; the cap is a pure CSS
 * `overflow: hidden` visual clip (no tokenizer cost to bound, since the
 * markdown renderer has no equivalent perf cliff to EuiCodeBlock's
 * refractor highlighter). The fullscreen button is always available since
 * there's no truncation signal to gate it on.
 */
const MarkdownBlock: React.FC<{ markdown: string }> = ({ markdown }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const content = <Markdown markdown={markdown} openLinksInNewTab={true} />;

  return (
    <div className="toolResultMarkdown">
      <div className="toolResultMarkdown__controls">
        <EuiButtonIcon
          iconType="fullScreen"
          color="text"
          aria-label={i18n.translate('chat.toolResult.showMarkdownFullscreen', {
            defaultMessage: 'Show fullscreen',
          })}
          onClick={() => setIsFullScreen(true)}
        />
      </div>
      <div className="toolResultMarkdown__preview" style={{ maxHeight: PREVIEW_MAX_HEIGHT }}>
        {content}
      </div>
      {isFullScreen && (
        <EuiModal
          onClose={() => setIsFullScreen(false)}
          maxWidth={false}
          className="toolResultMarkdown__modal"
        >
          <EuiModalHeader>
            <EuiModalHeaderTitle>
              <h2>
                {i18n.translate('chat.toolResult.modalTitle', {
                  defaultMessage: 'Tool Result',
                })}
              </h2>
            </EuiModalHeaderTitle>
          </EuiModalHeader>
          <EuiModalBody>{content}</EuiModalBody>
        </EuiModal>
      )}
    </div>
  );
};

/**
 * Renders a tool call result. Tries each shape in turn and uses the first
 * match: JSON, a `{text=[...]}` or `{text={...}}` wrapper, "text + JSON",
 * a plain pipe-delimited table, markdown, or plain text as a last resort.
 */
export const ToolResultRenderer: React.FC<ToolResultRendererProps> = React.memo(({ result }) => {
  return renderContent(result);
});

/** Max recursion depth for unwrapping nested JSON-encoded strings. */
const MAX_UNWRAP_DEPTH = 3;

function renderContent(text: string, depth = 0): JSX.Element {
  const parsed = tryParseJSON(text);
  if (parsed !== null) {
    // Unwrap a JSON string that itself contains encoded JSON, with a depth
    // guard to prevent stack overflow on pathologically nested encoding.
    if (typeof parsed === 'string') {
      if (depth < MAX_UNWRAP_DEPTH) {
        return renderContent(parsed, depth + 1);
      }
      // Exceeded max depth — render the decoded string as-is via the
      // shape-guessing pipeline without further recursion.
      return renderExtractedText(parsed);
    }
    // A single-item array whose item's ONLY key is `text` is the common
    // `[{text: "..."}]` tool-result shape — extract and re-render the text.
    // Any other array (multi-item, or an item with sibling keys) is shown
    // as-is so no data is lost.
    if (Array.isArray(parsed)) {
      if (parsed.length === 1 && isSoleTextObject(parsed[0])) {
        return renderExtractedText(parsed[0].text);
      }
      return <CodeBlock json={parsed} />;
    }
    // A bare object whose ONLY key is `text` gets the same treatment.
    if (isSoleTextObject(parsed)) {
      return renderExtractedText(parsed.text);
    }
    return <CodeBlock json={parsed} />;
  }

  const textArrayParsed = parseTextArrayWrapper(text);
  if (textArrayParsed.matched) {
    // Matched {text=[...]} but the inner content didn't parse — show as-is.
    if (textArrayParsed.value === null) {
      return <CodeBlock text={text} />;
    }
    const items = textArrayParsed.value;
    if (items.length === 1 && isSoleTextObject(items[0])) {
      return renderExtractedText(items[0].text);
    }
    return <CodeBlock json={items} />;
  }

  const textObjectParsed = parseTextObjectWrapper(text);
  if (textObjectParsed.matched) {
    // Matched {text={...}} but the inner content didn't parse — show as-is.
    if (textObjectParsed.value === null) {
      return <CodeBlock text={text} />;
    }
    const inner = textObjectParsed.value;
    if (isSoleTextObject(inner)) {
      return renderExtractedText(inner.text);
    }
    return <CodeBlock json={inner} />;
  }

  return renderExtractedText(text);
}

/**
 * Renders extracted/raw text: pure JSON, "text + JSON", a plain
 * pipe-delimited table, markdown, or plain text as a last resort. Every
 * branch hands the FULL, untruncated value to its terminal component —
 * truncation is `CodeBlock`'s job alone.
 *
 * Called both from `renderContent`'s final "no shape matched" fallback
 * (where `text` has already failed `tryParseJSON`, so Step 1 below can
 * never fire on that path) and from the `.text`-extraction sites above
 * (where the argument is an arbitrary string that may itself be
 * JSON-encoded — Step 1 exists for that case).
 */
function renderExtractedText(text: string): JSX.Element {
  // Pure JSON with no surrounding text, e.g. from [{text:"{...}"}].
  const parsedJson = tryParseJSON(text);
  if (parsedJson !== null && typeof parsedJson === 'object') {
    return <CodeBlock json={parsedJson} />;
  }

  // "descriptive text\n{json}". The prefix is rendered uncapped: truncation
  // exists only to bound EuiCodeBlock's tokenizer cost, and plain EuiText
  // has no equivalent perf cliff to bound.
  const split = splitTextAndJson(text);
  if (split) {
    const [prefix, json] = split;
    return (
      <>
        <EuiText size="s">{prefix}</EuiText>
        <EuiSpacer size="xs" />
        <CodeBlock text={json} />
      </>
    );
  }

  // A plain pipe-delimited table (e.g. `_cat` output, no separator row).
  const table = convertPipeDelimitedTable(text);
  if (table) {
    return <MarkdownBlock markdown={table} />;
  }

  // Markdown.
  if (hasMarkdownFeatures(text)) {
    return <MarkdownBlock markdown={text} />;
  }

  // Nothing recognized — show as plain text.
  return <CodeBlock text={text} />;
}

/**
 * A code block with JSON auto-detection/pretty-printing, truncation, a copy
 * button (copies the full formatted text when truncated), and a fullscreen
 * control that shows the complete, untruncated content in a modal.
 *
 * This is the ONLY place truncation happens in this file. Accepts either a
 * raw `text` string (JSON-vs-plain is auto-detected here) or an already-
 * parsed `json` value (parse is skipped, language is forced to `'json'`).
 * Does no shape-guessing beyond JSON detection — it never unwraps `.text`
 * or inspects object keys; all extraction decisions happen upstream.
 */
const CodeBlock: React.FC<{
  text?: string;
  json?: unknown;
  language?: string;
}> = ({ text, json, language }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  let formatted: string;
  let resolvedLanguage: string | undefined;
  if (json !== undefined) {
    formatted = JSON.stringify(json, null, 2);
    resolvedLanguage = 'json';
  } else {
    const parsed = tryParseJSON(text ?? '');
    if (parsed !== null && typeof parsed === 'object') {
      formatted = JSON.stringify(parsed, null, 2);
      resolvedLanguage = 'json';
    } else {
      formatted = text ?? '';
      resolvedLanguage = language;
    }
  }

  const isTruncated = formatted.length > MAX_DISPLAY_LENGTH;
  let preview = formatted;
  if (isTruncated) {
    const linePreview = formatted.split('\n').slice(0, MAX_PREVIEW_LINES).join('\n');
    // Fallback for a single huge line with no `\n`: line-slicing alone does
    // nothing (split('\n') returns one element), so hard-cap at
    // MAX_DISPLAY_LENGTH characters to guarantee the preview is bounded.
    preview =
      linePreview.length > MAX_DISPLAY_LENGTH
        ? linePreview.slice(0, MAX_DISPLAY_LENGTH)
        : linePreview;
  }

  return (
    <div className="toolResultCodeBlock__wrapper">
      <EuiButtonIcon
        className="toolResultCodeBlock__expandFull"
        iconType="fullScreen"
        color="text"
        aria-label={i18n.translate('chat.toolResult.showResultFullscreen', {
          defaultMessage: 'Show full tool result',
        })}
        onClick={() => setIsFullScreen(true)}
      />
      <EuiCodeBlock
        className="toolResultCodeBlock"
        language={resolvedLanguage}
        paddingSize="none"
        fontSize="s"
        transparentBackground
        overflowHeight={PREVIEW_MAX_HEIGHT}
        // The built-in copy button only copies what's visible. Use our own
        // when truncated, so copy always gets the full formatted result.
        isCopyable={!isTruncated}
      >
        {preview}
      </EuiCodeBlock>
      {isTruncated && (
        <EuiCopy textToCopy={formatted} anchorClassName="toolResultCodeBlock__copyFull">
          {(copy) => (
            <EuiButtonIcon
              iconType="copy"
              color="text"
              aria-label={i18n.translate('chat.toolResult.copyFullResult', {
                defaultMessage: 'Copy full tool result',
              })}
              onClick={copy}
            />
          )}
        </EuiCopy>
      )}
      {isTruncated && (
        <EuiText size="xs" color="subdued" style={{ marginTop: 4 }}>
          {i18n.translate('chat.toolResult.truncationNoticeFullscreen', {
            defaultMessage:
              '…[{truncatedCount} characters truncated. Use fullscreen button above for full content.]',
            values: {
              truncatedCount: (formatted.length - preview.length).toLocaleString(),
            },
          })}
        </EuiText>
      )}
      {isFullScreen && (
        <EuiModal
          onClose={() => setIsFullScreen(false)}
          maxWidth={false}
          className="toolResultCodeBlock__modal"
        >
          <EuiModalHeader>
            <EuiModalHeaderTitle>
              <h2>
                {i18n.translate('chat.toolResult.modalTitle', {
                  defaultMessage: 'Tool Result',
                })}
              </h2>
            </EuiModalHeaderTitle>
          </EuiModalHeader>
          <EuiModalBody>
            <EuiCodeBlock
              className="toolResultCodeBlock__modalBlock"
              language={resolvedLanguage}
              paddingSize="none"
              fontSize="s"
              transparentBackground
              isCopyable
            >
              {formatted}
            </EuiCodeBlock>
          </EuiModalBody>
        </EuiModal>
      )}
    </div>
  );
};
