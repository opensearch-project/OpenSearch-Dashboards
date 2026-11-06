/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './json_tree.scss';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { EuiButtonIcon, copyToClipboard } from '@elastic/eui';
import { escapeRegExp } from 'lodash';
import { i18n } from '@osd/i18n';
import {
  JsonTreeState,
  getJsonTreeState,
  getJsonTreesVersion,
  isExpandAllJsonTrees,
  subscribeJsonTrees,
} from './json_tree_state';
import { JsonContainer, containsTerm, isContainer } from './json_utils';

/**
 * The JSON tree shown in place of a string value that holds JSON, in the results table
 * (`TableCell`) and in the expanded document (`DocViewTableRow`).
 *
 * Files of this folder:
 * - json_tree.tsx: the component (this file)
 * - json_utils.ts: detecting JSON, matching a leaf to an indexed field, highlight terms
 * - json_tree_state.ts: what the user expanded, remembered outside React
 * - format_json_setting.ts: whether values are shown as a tree at all
 * - query_highlight_terms.ts: what to highlight for the current query
 *
 * Components here, outermost first: JsonTree > JsonNode (recursive) > LineActions / Primitive.
 */

// Children of one object or array rendered at a time; the rest are behind "show more".
const MAX_CHILDREN = 50;
// How long a copy button shows its "copied" state.
const COPIED_FEEDBACK_MS = 1500;

/**
 * Given the key path of a leaf (array indices omitted) and its value, returns a callback that
 * filters for ('+') or out ('-') that value, or undefined when the leaf cannot be filtered.
 */
export type GetLeafFilter = (
  path: string[],
  value: unknown
) => ((mode: '+' | '-') => void) | undefined;

/** What a JsonTree shares with its nodes, so it is not passed down through every level. */
interface TreeContextValue {
  getLeafFilter?: GetLeafFilter;
  highlightTerms: string[];
  isCollapsed: (nodeId: string, depth: number, value: unknown) => boolean;
  setCollapsed: (nodeId: string, collapsed: boolean) => void;
  // How many children of a node are rendered
  getShown: (nodeId: string) => number;
  showMore: (nodeId: string, shown: number) => void;
  // The one tree item in the tab order (roving tab stop); '' is the root
  activeNodeId: string;
  setActiveNodeId: (nodeId: string) => void;
}

const TreeContext = createContext<TreeContextValue>({
  highlightTerms: [],
  isCollapsed: (nodeId, depth) => depth > 0,
  setCollapsed: () => {},
  getShown: () => MAX_CHILDREN,
  showMore: () => {},
  activeNodeId: '',
  setActiveNodeId: () => {},
});

/** True when `nodeId` is below `ancestorId` in the tree ('' is the root). */
const isDescendant = (nodeId: string, ancestorId: string) =>
  nodeId !== ancestorId &&
  (ancestorId === '' || nodeId.startsWith(`${ancestorId}.`) || nodeId.startsWith(`${ancestorId}[`));

/** Renders `text` with the tree's highlight terms wrapped in <mark>. */
const Highlighted = ({ text }: { text: string }) => {
  const { highlightTerms } = useContext(TreeContext);
  if (highlightTerms.length === 0) return <>{text}</>;
  // Longest first, so a term is not split by a shorter one it contains.
  const pattern = [...highlightTerms]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|');
  const parts = text.split(new RegExp(`(${pattern})`));
  return (
    <>
      {parts.map((part, i) =>
        // With one capture group, the matches are the odd entries.
        i % 2 === 1 ? <mark key={i}>{part}</mark> : part
      )}
    </>
  );
};

/** A leaf value, coloured by its type. */
const Primitive = ({ value }: { value: unknown }) => {
  if (value === null) return <span className="exploreJsonTree__null">null</span>;
  switch (typeof value) {
    case 'string':
      // Quoted, so the string "502" can be told apart from the number 502.
      return (
        <span className="exploreJsonTree__string">
          <Highlighted text={JSON.stringify(value)} />
        </span>
      );
    case 'number':
      return (
        <span className="exploreJsonTree__number">
          <Highlighted text={String(value)} />
        </span>
      );
    case 'boolean':
      return <span className="exploreJsonTree__boolean">{String(value)}</span>;
    default:
      return <span className="exploreJsonTree__string">{String(value)}</span>;
  }
};

/** True for COPIED_FEEDBACK_MS after `markCopied` is called. */
const useCopiedFeedback = (): [boolean, () => void] => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const markCopied = () => {
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  };
  return [copied, markCopied];
};

interface LineActionsProps {
  // Key path without array indices, used to find a field to filter on.
  path: string[];
  // Full path including array indices, e.g. `tracking.events[0].status`.
  nodeId: string;
  value: unknown;
}

/**
 * Hover actions of a line: copy its path and, for a filterable leaf, filter for/out. The root
 * line has no path; its copy action copies the whole value as pretty-printed JSON.
 */
const LineActions = ({ path, nodeId, value }: LineActionsProps) => {
  const { getLeafFilter } = useContext(TreeContext);
  const [copied, markCopied] = useCopiedFeedback();
  const applyFilter = isContainer(value) ? undefined : getLeafFilter?.(path, value);

  if (!nodeId) {
    const copyJson = i18n.translate('explore.jsonTree.copyJson', { defaultMessage: 'Copy JSON' });
    return (
      <span className="exploreJsonTree__actions">
        <EuiButtonIcon
          size="xs"
          iconType={copied ? 'check' : 'copy'}
          onClick={() => {
            copyToClipboard(JSON.stringify(value, null, 2));
            markCopied();
          }}
          aria-label={copyJson}
          title={copyJson}
          data-test-subj="jsonTreeCopyJson"
        />
      </span>
    );
  }

  const copyPath = i18n.translate('explore.jsonTree.copyPath', {
    defaultMessage: 'Copy path: {path}',
    values: { path: nodeId },
  });
  const filterFor = i18n.translate('explore.jsonTree.filterForValue', {
    defaultMessage: 'Filter for value',
  });
  const filterOut = i18n.translate('explore.jsonTree.filterOutValue', {
    defaultMessage: 'Filter out value',
  });

  return (
    <span className="exploreJsonTree__actions">
      {applyFilter && (
        <span data-test-subj="jsonTreeLeafFilter">
          <EuiButtonIcon
            size="xs"
            iconType="magnifyWithPlus"
            onClick={() => applyFilter('+')}
            aria-label={filterFor}
            title={filterFor}
            data-test-subj="jsonTreeFilterFor"
          />
          <EuiButtonIcon
            size="xs"
            iconType="magnifyWithMinus"
            onClick={() => applyFilter('-')}
            aria-label={filterOut}
            title={filterOut}
            data-test-subj="jsonTreeFilterOut"
          />
        </span>
      )}
      <EuiButtonIcon
        size="xs"
        iconType={copied ? 'check' : 'copy'}
        onClick={() => {
          copyToClipboard(nodeId);
          markCopied();
        }}
        aria-label={copyPath}
        title={copyPath}
        data-test-subj="jsonTreeCopyPath"
      />
    </span>
  );
};

interface NodeProps {
  name?: string;
  value: unknown;
  isLast: boolean;
  depth: number;
  // Object keys leading to this node; array indices are not part of the path.
  path: string[];
  // Full path including array indices; also identifies the node within its tree.
  nodeId: string;
}

/**
 * One node of the tree and, when expanded, its children. Renders one of four shapes: a leaf
 * (`key: value`), an empty container (`key: {}`), a collapsed container (`key: { [+] }`) or an
 * expanded container (opening line, indented children, closing line).
 */
const JsonNode = ({ name, value, isLast, depth, path, nodeId }: NodeProps) => {
  const { isCollapsed, setCollapsed, getShown, showMore, activeNodeId, setActiveNodeId } =
    useContext(TreeContext);
  const comma = isLast ? '' : ',';
  const key =
    name !== undefined ? (
      <>
        <span className="exploreJsonTree__key">
          <Highlighted text={name} />
        </span>
        {': '}
      </>
    ) : null;
  const actions = <LineActions path={path} nodeId={nodeId} value={value} />;
  // ARIA tree item with a roving tab stop: only the active item is in the tab order, the
  // arrow keys move between items (handled on the tree).
  const itemProps = {
    role: 'treeitem',
    'aria-level': depth + 1,
    tabIndex: activeNodeId === nodeId ? 0 : -1,
    'data-node-id': nodeId,
    onFocus: (event: React.FocusEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) setActiveNodeId(nodeId);
    },
  };

  // Read out as `key: value`, without the punctuation and the action buttons of the line.
  const leafLabel = (text: string) => (name !== undefined ? `${name}: ${text}` : text);

  if (!isContainer(value)) {
    return (
      <div
        className="exploreJsonTree__line"
        {...itemProps}
        aria-label={leafLabel(typeof value === 'string' ? JSON.stringify(value) : String(value))}
      >
        {key}
        <Primitive value={value} />
        {comma}
        {actions}
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const [open, close] = isArray ? ['[', ']'] : ['{', '}'];
  const entries: Array<[string, unknown]> = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v])
    : Object.entries(value);

  if (entries.length === 0) {
    return (
      <div className="exploreJsonTree__line" {...itemProps} aria-label={leafLabel(open + close)}>
        {key}
        {open}
        {close}
        {comma}
        {actions}
      </div>
    );
  }

  const collapsed = isCollapsed(nodeId, depth, value);
  // Large objects and arrays are rendered a batch of children at a time.
  const shown = getShown(nodeId);
  const hidden = entries.length - shown;
  const sizeLabel = isArray
    ? i18n.translate('explore.jsonTree.arraySize', {
        defaultMessage: '{count} items',
        values: { count: entries.length },
      })
    : i18n.translate('explore.jsonTree.objectSize', {
        defaultMessage: '{count} keys',
        values: { count: entries.length },
      });
  const toggle = (
    <button
      type="button"
      className="exploreJsonTree__toggle"
      onClick={() => setCollapsed(nodeId, !collapsed)}
      // Keyboard users expand and collapse from the tree item itself
      tabIndex={-1}
      aria-label={
        collapsed
          ? i18n.translate('explore.jsonTree.expand', { defaultMessage: 'Expand' })
          : i18n.translate('explore.jsonTree.collapse', { defaultMessage: 'Collapse' })
      }
      // The size of a collapsed node is not printed in the tree; it shows on hover
      title={collapsed ? sizeLabel : undefined}
      data-test-subj="jsonTreeToggle"
    >
      [{collapsed ? '+' : '-'}]
    </button>
  );

  const itemLabel = isArray
    ? i18n.translate('explore.jsonTree.arrayItemLabel', {
        defaultMessage: '{name} array, {count} items',
        values: { name: name ?? '', count: entries.length },
      })
    : i18n.translate('explore.jsonTree.objectItemLabel', {
        defaultMessage: '{name} object, {count} keys',
        values: { name: name ?? '', count: entries.length },
      });

  if (collapsed) {
    return (
      <div {...itemProps} aria-expanded={false} aria-label={itemLabel.trim()}>
        <div className="exploreJsonTree__line">
          {key}
          {open} {toggle} {close}
          {comma}
          {actions}
        </div>
      </div>
    );
  }

  return (
    <div {...itemProps} aria-expanded={true} aria-label={itemLabel.trim()}>
      <div className="exploreJsonTree__line">
        {key}
        {open} {toggle}
        {actions}
      </div>
      <div className="exploreJsonTree__children" role="group">
        {entries.slice(0, shown).map(([childName, childValue], i) => (
          <JsonNode
            key={childName}
            name={isArray ? undefined : childName}
            value={childValue}
            isLast={i === entries.length - 1 && hidden <= 0}
            depth={depth + 1}
            path={isArray ? path : [...path, childName]}
            nodeId={
              isArray ? `${nodeId}[${childName}]` : nodeId ? `${nodeId}.${childName}` : childName
            }
          />
        ))}
        {hidden > 0 && (
          <div className="exploreJsonTree__line">
            <button
              type="button"
              className="exploreJsonTree__link"
              onClick={() => showMore(nodeId, shown + MAX_CHILDREN)}
              data-test-subj="jsonTreeShowMore"
            >
              {i18n.translate('explore.jsonTree.showMore', {
                defaultMessage: 'Show {count} more ({hidden} hidden)',
                values: { count: Math.min(MAX_CHILDREN, hidden), hidden },
              })}
            </button>
          </div>
        )}
      </div>
      <div className="exploreJsonTree__line">
        {close}
        {comma}
      </div>
    </div>
  );
};

export interface JsonTreeProps {
  // The parsed JSON, see `tryParseJson`
  value: JsonContainer;
  // The original string, shown by "Show as raw text"
  rawText: string;
  // Leaves for which this returns a callback get filter-for / filter-out buttons.
  getLeafFilter?: GetLeafFilter;
  // Identifies this tree (document + field) so its expanded nodes and raw/formatted choice are
  // remembered across re-mounts. Without it the choices last only while the tree is mounted.
  stateKey?: string;
  // Texts to highlight (search matches), see `extractHighlightTerms`. Nodes containing one are
  // expanded by default.
  highlightTerms?: string[];
}

const NO_TERMS: string[] = [];

/**
 * Splunk-style, syntax-highlighted, collapsible rendering of a JSON value, with a link to
 * switch back to the raw text. Built from React elements only (no innerHTML).
 */
export const JsonTree = ({
  value,
  rawText,
  getLeafFilter,
  stateKey,
  highlightTerms = NO_TERMS,
}: JsonTreeProps) => {
  // `version` changes on "expand all" / "collapse all": the tree re-renders and its own
  // choices are dropped (the shared store clears them; the local fallback is reset here).
  const version = useSyncExternalStore(subscribeJsonTrees, getJsonTreesVersion);
  const local = useRef<{ version: number; state: JsonTreeState }>();
  if (!local.current || local.current.version !== version) {
    local.current = { version, state: { showRaw: false, collapsed: {}, shown: {} } };
  }
  // The view state lives in the shared store when the tree has a key, so it outlives this
  // component; otherwise in a ref. Either way it is a plain object that is mutated in place,
  // so every change is followed by `rerender()`.
  const state = stateKey ? getJsonTreeState(stateKey) : local.current.state;
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  const [activeNodeId, setActiveNodeId] = useState('');

  const context = useMemo<TreeContextValue>(
    () => ({
      getLeafFilter,
      highlightTerms,
      // The user's own toggle wins. Otherwise only the root is open, plus the branches that
      // contain a search match, unless "expand all" is in effect.
      isCollapsed: (nodeId, depth, nodeValue) =>
        state.collapsed[nodeId] ??
        (!isExpandAllJsonTrees() && depth > 0 && !containsTerm(nodeValue, highlightTerms)),
      setCollapsed: (nodeId, collapsed) => {
        state.collapsed[nodeId] = collapsed;
        // Keep a tab stop: the active item is removed when one of its ancestors collapses.
        if (collapsed && isDescendant(activeNodeId, nodeId)) setActiveNodeId(nodeId);
        rerender();
      },
      getShown: (nodeId) => state.shown[nodeId] ?? MAX_CHILDREN,
      showMore: (nodeId, shown) => {
        state.shown[nodeId] = shown;
        rerender();
      },
      activeNodeId,
      setActiveNodeId,
    }),
    // `version` is listed because it changes what isExpandAllJsonTrees() returns
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getLeafFilter, highlightTerms, state, version, activeNodeId]
  );

  // Keyboard navigation of the ARIA tree pattern
  // (https://www.w3.org/WAI/ARIA/apg/patterns/treeview/). Only acts when a tree item itself has
  // focus, so the buttons inside an item keep their own keys.
  const onTreeKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const item = event.target as HTMLElement;
    if (item.getAttribute('role') !== 'treeitem') return;
    // Collapsed children are not rendered, so these are exactly the visible items, in order.
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('[role="treeitem"]')
    );
    const index = items.indexOf(item);
    const expanded = item.getAttribute('aria-expanded');
    const nodeId = item.dataset.nodeId ?? '';
    let next: HTMLElement | null | undefined;
    switch (event.key) {
      case 'ArrowDown':
        next = items[index + 1];
        break;
      case 'ArrowUp':
        next = items[index - 1];
        break;
      case 'Home':
        next = items[0];
        break;
      case 'End':
        next = items[items.length - 1];
        break;
      case 'ArrowRight':
        if (expanded === 'false') context.setCollapsed(nodeId, false);
        else if (expanded === 'true') next = items[index + 1];
        break;
      case 'ArrowLeft':
        if (expanded === 'true') context.setCollapsed(nodeId, true);
        else next = item.parentElement?.closest<HTMLElement>('[role="treeitem"]');
        break;
      case 'Enter':
      case ' ':
        if (expanded === null) return;
        context.setCollapsed(nodeId, expanded === 'true');
        break;
      default:
        return;
    }
    event.preventDefault();
    next?.focus();
  };

  const setShowRaw = (showRaw: boolean) => {
    state.showRaw = showRaw;
    rerender();
  };

  return (
    <div className="exploreJsonTree" data-test-subj="exploreJsonTree">
      {state.showRaw ? (
        <div className="exploreJsonTree__raw" data-test-subj="exploreJsonTreeRaw">
          {rawText}
        </div>
      ) : (
        <TreeContext.Provider value={context}>
          {/* The key handler serves the focusable tree items inside */}
          {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
          <div
            role="tree"
            aria-label={i18n.translate('explore.jsonTree.treeLabel', {
              defaultMessage: 'JSON value',
            })}
            onKeyDown={onTreeKeyDown}
          >
            <JsonNode value={value} isLast depth={0} path={[]} nodeId="" />
          </div>
        </TreeContext.Provider>
      )}
      <div className="exploreJsonTree__footer">
        <button
          type="button"
          className="exploreJsonTree__link"
          onClick={() => setShowRaw(!state.showRaw)}
          data-test-subj="jsonTreeRawToggle"
        >
          {state.showRaw
            ? i18n.translate('explore.jsonTree.showFormatted', {
                defaultMessage: 'Show as formatted JSON',
              })
            : i18n.translate('explore.jsonTree.showRaw', { defaultMessage: 'Show as raw text' })}
        </button>
      </div>
    </div>
  );
};
