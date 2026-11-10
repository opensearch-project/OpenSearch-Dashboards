/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './json_tree.scss';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { escapeRegExp } from 'lodash';
import { EuiLink } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { parse } from '@osd/std';

type JsonObjectOrArray = Record<string, unknown> | unknown[];

const isObjectOrArray = (value: unknown): value is JsonObjectOrArray =>
  typeof value === 'object' && value !== null;

// Integers past 2^53 come back as bigint, so they keep every digit. A value nested deeper than the
// parser can read throws, so it keeps the formatter's text.
export const parseJsonObjectOrArray = (value: unknown): JsonObjectOrArray | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return undefined;
  try {
    const parsed: JsonObjectOrArray = parse(trimmed);
    // An empty {} or [] has nothing to fold, so it keeps the formatter's output.
    if (sizeOf(parsed) === 0) return undefined;
    return parsed;
  } catch (e) {
    return undefined;
  }
};

// The field formatter wraps search matches in <mark>, so the tree reads them back to mark again.
export const extractHighlightTerms = (html: unknown): string[] => {
  if (typeof html !== 'string' || !html.includes('<mark')) return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const terms = Array.from(doc.querySelectorAll('mark'), (mark) => mark.textContent ?? '');
  return Array.from(new Set(terms.filter((term) => term.length > 0)));
};

// The Table settings switches. Only ExploreDataTable provides them, so a dashboard panel or the
// single-document page gets the default of both off and keeps the formatter's text.
export interface JsonTreeSettings {
  showJsonFormat: boolean;
  expandAllJson: boolean;
}
export const JsonTreeSettingsContext = createContext<JsonTreeSettings>({
  showJsonFormat: false,
  expandAllJson: false,
});

// The parsed tree for a raw field value, or undefined when Show as JSON format is off or the value
// is not JSON, plus the search terms the formatter marked in its HTML. Shared by the data table
// cell and the Table tab row.
export const useJsonTreeValue = (valueRaw: unknown, formattedHtml: unknown) => {
  const { showJsonFormat } = useContext(JsonTreeSettingsContext);
  const jsonTreeValue = useMemo(
    () => (showJsonFormat ? parseJsonObjectOrArray(valueRaw) : undefined),
    [showJsonFormat, valueRaw]
  );
  const highlightTerms = useMemo(
    () => (jsonTreeValue ? extractHighlightTerms(formattedHtml) : []),
    [jsonTreeValue, formattedHtml]
  );
  return { jsonTreeValue, highlightTerms };
};

const HighlightPatternContext = createContext<RegExp | undefined>(undefined);

// One pattern per tree, longest terms first so a longer match wins over a shorter one. A term
// matches anywhere in a key or value, so it can also mark inside a longer word.
const useHighlightPattern = (terms: string[]) =>
  useMemo(() => {
    if (terms.length === 0) return undefined;
    const sorted = [...terms].sort((a, b) => b.length - a.length);
    return new RegExp(`(${sorted.map(escapeRegExp).join('|')})`, 'g');
  }, [terms]);

const HighlightedText = ({ text }: { text: string }) => {
  const pattern = useContext(HighlightPatternContext);
  if (!pattern) return <>{text}</>;
  // split with one capture group puts every match at an odd index.
  const parts = text.split(pattern);
  return <>{parts.map((part, i) => (i % 2 === 1 ? <mark key={i}>{part}</mark> : part))}</>;
};

const Leaf = ({ value }: { value: unknown }) => {
  if (value === null) {
    return (
      <span className="exploreJsonTree__null">
        <HighlightedText text="null" />
      </span>
    );
  }
  const kind =
    typeof value === 'string' ? 'string' : typeof value === 'boolean' ? 'boolean' : 'number';
  return (
    <span className={`exploreJsonTree__${kind}`}>
      <HighlightedText text={leafText(value)} />
    </span>
  );
};

const JsonKey = ({ name }: { name: string }) => (
  <span className="exploreJsonTree__key">
    <HighlightedText text={name} />
  </span>
);

const sizeOf = (value: JsonObjectOrArray) =>
  Array.isArray(value) ? value.length : Object.keys(value).length;

// Object keys sort by character code at every level, as Splunk does, so "10" comes before "2" and
// capitals come before lowercase. Array elements keep their order.
const entriesOf = (value: JsonObjectOrArray): Array<[string, unknown]> =>
  Array.isArray(value)
    ? value.map((child, i) => [String(i), child])
    : Object.keys(value)
        .sort()
        .map((key) => [key, value[key]]);

const bracketsOf = (value: JsonObjectOrArray) => (Array.isArray(value) ? ['[', ']'] : ['{', '}']);

const leafText = (value: unknown) =>
  typeof value === 'string' ? JSON.stringify(value) : String(value);

// A branch below the root opens by itself, through Expand all, the expanded document or a
// search match, only while its own entries fit in this many characters, with each nested branch
// counted as {} or []. So one long value keeps only its own branch closed, and a wide branch stays
// closed however short each entry is.
const MAX_BRANCH_CHARS_TO_AUTO_OPEN = 1000;

// Expand all, the expanded document and a search match open at most this many levels by
// themselves, the root as level 1. A deeper branch opens on a click, one level at a time, so a
// value thousands of levels deep never mounts every level at once. The Expand all tooltip and the
// expandAllJson doc in ui_slice.ts state this number too.
const MAX_LEVELS_TO_AUTO_OPEN = 15;

const ownEntriesFit = (branch: JsonObjectOrArray) => {
  const isArray = Array.isArray(branch);
  // The brackets, less the comma the last entry does not have.
  let length = 1;
  // Order does not matter for a length, so the keys are not sorted.
  for (const [key, child] of isArray ? branch.entries() : Object.entries(branch)) {
    length += (isArray ? 0 : JSON.stringify(key).length + 1) + 1;
    length += isObjectOrArray(child) ? 2 : leafText(child).length;
    if (length > MAX_BRANCH_CHARS_TO_AUTO_OPEN) return false;
  }
  return true;
};

// Whether a key or leaf anywhere inside the branch matches the search. It is true even when the
// match sits past the first page of a branch, where the user reaches it through Show more. Order
// does not matter here, so the keys are not sorted. A loop, so no depth overflows the call stack.
const containsMatch = (branch: JsonObjectOrArray, pattern: RegExp) => {
  const pending = [branch];
  for (let value = pending.pop(); value; value = pending.pop()) {
    const isArray = Array.isArray(value);
    for (const [key, child] of Object.entries(value)) {
      if (!isArray && key.search(pattern) !== -1) return true;
      if (isObjectOrArray(child)) pending.push(child);
      else if (leafText(child).search(pattern) !== -1) return true;
    }
  }
  return false;
};

const JsonTreeSummary = ({ name, value }: { name?: string; value: JsonObjectOrArray }) => {
  const [openingBracket, closingBracket] = bracketsOf(value);
  const size = sizeOf(value);
  const countLabel = (
    <span className="exploreJsonTree__count">
      {openingBracket}
      {size}
      {closingBracket}
    </span>
  );
  // A keyed branch shows its count after the key. The root and array elements have no key, so
  // their count follows the toggle.
  return (
    <summary>
      {name !== undefined && (
        <>
          <JsonKey name={name} /> {countLabel}:{' '}
        </>
      )}
      {openingBracket} <span className="exploreJsonTree__toggleIcon" />
      {name === undefined && <> {countLabel}</>}
      <span className="exploreJsonTree__collapsedClosingBracket"> {closingBracket}</span>
    </summary>
  );
};

interface JsonTreeChildrenProps {
  value: JsonObjectOrArray;
  // How deep this value sits, the root as level 1.
  level: number;
  // Whether a branch starts open. The browser owns its open state until a new search flips this
  // branch's answer, which can open or close it again. Expand all redraws the tree.
  shouldStartOpen: (branch: JsonObjectOrArray, level: number) => boolean;
}

// A branch draws this many entries at a time, so a wide branch costs at most this many nodes until
// the user asks for more.
const ENTRIES_PER_PAGE = 50;

const JsonTreeChildren = ({ value, level, shouldStartOpen }: JsonTreeChildrenProps) => {
  const [shownCount, setShownCount] = useState(ENTRIES_PER_PAGE);
  const entries = useMemo(() => entriesOf(value), [value]);
  const nextPageSize = Math.min(ENTRIES_PER_PAGE, entries.length - shownCount);
  return (
    <>
      <div className="exploreJsonTree__children">
        {entries.slice(0, shownCount).map(([key, child]) => (
          <JsonTreeNode
            key={key}
            name={Array.isArray(value) ? undefined : key}
            value={child}
            level={level + 1}
            shouldStartOpen={shouldStartOpen}
          />
        ))}
      </div>
      {nextPageSize > 0 && (
        <div className="exploreJsonTree__showMore">
          <EuiLink
            onClick={() => setShownCount(shownCount + ENTRIES_PER_PAGE)}
            data-test-subj="exploreJsonTreeShowMore"
          >
            {i18n.translate('explore.jsonTree.showMore', {
              defaultMessage: 'Show {count} more',
              values: { count: nextPageSize },
            })}
          </EuiLink>
        </div>
      )}
    </>
  );
};

// One key or array element, or the root. A branch is a native <details>, so the browser opens and
// closes it on its own. A branch that starts closed mounts its children only when first opened,
// and they stay mounted. Memoised, so a parent render does not redraw an unchanged subtree.
const JsonTreeNode = React.memo(function JsonTreeNodeUI({
  name,
  value,
  level,
  shouldStartOpen,
}: Omit<JsonTreeChildrenProps, 'value'> & { name?: string; value: unknown }) {
  // A branch is a non-empty object or array, which folds. Anything else is a leaf.
  const isBranch = isObjectOrArray(value) && sizeOf(value) > 0;
  // Kept when the user first opens this branch, since containsMatch walks the whole subtree.
  const startsOpenHere = useMemo(
    () => isBranch && shouldStartOpen(value as JsonObjectOrArray, level),
    [isBranch, shouldStartOpen, value, level]
  );
  const [childrenMounted, setChildrenMounted] = useState(startsOpenHere);
  if (!isBranch) {
    return (
      <div>
        {name !== undefined && (
          <>
            <JsonKey name={name} />:{' '}
          </>
        )}
        {isObjectOrArray(value) ? bracketsOf(value).join('') : <Leaf value={value} />}
      </div>
    );
  }
  const branch = value as JsonObjectOrArray;
  return (
    <details
      open={startsOpenHere}
      onToggle={(event) => {
        if ((event.currentTarget as HTMLDetailsElement).open) setChildrenMounted(true);
      }}
    >
      <JsonTreeSummary name={name} value={branch} />
      {childrenMounted && (
        <JsonTreeChildren value={branch} level={level} shouldStartOpen={shouldStartOpen} />
      )}
      <div>{bracketsOf(branch)[1]}</div>
    </details>
  );
});

interface JsonTreeProps {
  value: JsonObjectOrArray;
  raw: string;
  highlightTerms?: string[];
  // Set by the expanded document's Table tab, which opens up to MAX_LEVELS_TO_AUTO_OPEN
  // levels, each branch only while its own entries fit.
  inExpandedDocument?: boolean;
  'data-test-subj'?: string;
}

// A stable default, so useHighlightPattern does not rebuild its pattern on every render.
const NO_TERMS: string[] = [];

// The root is a branch like any other, so its toggle opens and closes the root only, and the
// branches inside keep their open state.
export const JsonTree = ({
  value,
  raw,
  highlightTerms = NO_TERMS,
  inExpandedDocument = false,
  'data-test-subj': dataTestSubj = 'exploreJsonTree',
}: JsonTreeProps) => {
  const { expandAllJson } = useContext(JsonTreeSettingsContext);
  const opensFittingBranches = inExpandedDocument || expandAllJson;
  const [showRaw, setShowRaw] = useState(false);
  const highlightPattern = useHighlightPattern(highlightTerms);
  // The root always starts open. A deeper branch runs this rule when it first draws and again when
  // the search changes, so one inside a closed branch waits until it is opened.
  const shouldStartOpen = useCallback(
    (branch: JsonObjectOrArray, level: number) =>
      level === 1 ||
      (level <= MAX_LEVELS_TO_AUTO_OPEN &&
        (opensFittingBranches
          ? ownEntriesFit(branch)
          : highlightPattern !== undefined &&
            ownEntriesFit(branch) &&
            containsMatch(branch, highlightPattern))),
    [opensFittingBranches, highlightPattern]
  );

  return (
    <div className="exploreJsonTree" data-test-subj={dataTestSubj}>
      <HighlightPatternContext.Provider value={highlightPattern}>
        {showRaw ? (
          <div className="exploreJsonTree__raw">
            <HighlightedText text={raw} />
          </div>
        ) : (
          <JsonTreeNode
            // Expand all redraws the tree, so every level, the root included, takes the new rule.
            key={String(opensFittingBranches)}
            value={value}
            level={1}
            shouldStartOpen={shouldStartOpen}
          />
        )}
      </HighlightPatternContext.Provider>
      <EuiLink onClick={() => setShowRaw(!showRaw)} data-test-subj="exploreJsonTreeRawToggle">
        {showRaw
          ? i18n.translate('explore.jsonTree.showFormatted', {
              defaultMessage: 'Show as formatted JSON',
            })
          : i18n.translate('explore.jsonTree.showRaw', { defaultMessage: 'Show as raw text' })}
      </EuiLink>
    </div>
  );
};
