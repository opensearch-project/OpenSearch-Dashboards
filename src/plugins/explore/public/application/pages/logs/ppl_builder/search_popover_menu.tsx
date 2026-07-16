/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef, useState } from 'react';
import {
  EuiFieldSearch,
  EuiIcon,
  EuiPopover,
  EuiPopoverProps,
  EuiPopoverTitle,
  EuiToolTip,
} from '@elastic/eui';

/**
 * One selectable row in the popover list.
 *
 * Filtering matches the user's query against {@link filterText} (falling back to
 * the row's `key`), so a row whose visible label is a React node still filters on
 * plain text. Rows are rendered in the order given; when consecutive rows carry a
 * different {@link group} a section header is drawn, so grouping is expressed
 * purely by ordering + the `group` field (a menu with no groups renders a flat
 * list). The first row surviving the filter is what the Enter shortcut applies,
 * so lead with the most-common option (e.g. the "over time" entry).
 */
export interface SearchMenuOption {
  /** Unique key (React key + default filter text). */
  key: string;
  /** Rendered row content. */
  label: React.ReactNode;
  /** Text the search query filters against (defaults to `key`). */
  filterText?: string;
  /** Section header this row falls under; omit for an ungrouped row. */
  group?: string;
  /** Whether this row is currently selected (shows a check in a checkable menu). */
  selected?: boolean;
  /**
   * Fixed leading icon (e.g. `clock`, `plus`) shown in place of the check — used
   * by the special "over time" / "create" rows. In a checkable menu a row
   * without this gets the check slot; without it in a plain menu there is no icon.
   */
  leadingIcon?: string;
  /** Muted trailing hint (e.g. the "every 1h" subtitle on the over-time row). */
  hint?: React.ReactNode;
  /** When set, the row is wrapped in a tooltip revealing the real syntax. */
  tooltip?: string;
  onSelect: () => void;
  dataTestSubj?: string;
}

/**
 * The pieces of the trigger, returned by {@link SearchPopoverMenuProps.trigger}.
 * `anchor` becomes the popover's `button` — keep it to just the dropdown
 * caret/icon so the panel's beak lines up under it rather than the middle of a
 * wide control. `leading` (a label or pills) renders before the popover, and
 * `wrapperClassName` styles the row that holds both.
 */
export interface TriggerParts {
  anchor: React.ReactElement;
  leading?: React.ReactNode;
  wrapperClassName?: string;
}

interface SearchPopoverMenuProps {
  /** The selectable rows (already ordered; grouping derives from `group`). */
  options: SearchMenuOption[];
  /**
   * Builds the trigger from a toggle handler. Return just an `anchor` for a
   * single-button trigger (ƒx glyph, interval chip), or add `leading` +
   * `wrapperClassName` for a label/pills-plus-caret trigger.
   */
  trigger: (toggle: () => void) => TriggerParts;
  /**
   * Reserve a leading check column (marking `selected` rows) and render each row
   * as a `plqFieldOption`. Off for the flat aggregation / function lists.
   */
  checkable?: boolean;
  /**
   * When set, typing a value that matches no option exactly offers a "create"
   * row (and Enter on an otherwise-empty result applies it). Used to accept
   * arbitrary field names / custom intervals.
   */
  allowCreate?: {
    onCreate: (value: string) => void;
    dataTestSubj?: string;
  };
  /** Keep the popover open after a selection (multi-select); defaults to closing. */
  keepOpenOnSelect?: boolean;
  /** Fired when the popover transitions to open — for lazily loading its options. */
  onOpen?: () => void;
  searchPlaceholder: string;
  emptyMessage: string;
  /** Anchor side; defaults to `downLeft` so the panel hangs from the left edge. */
  anchorPosition?: EuiPopoverProps['anchorPosition'];
  /** data-test-subj for the search box (`${x}-search`). */
  searchDataTestSubj?: string;
}

/**
 * The shared search-first popover menu behind the logs PPL builder's controls —
 * the "Show" aggregation picker, the `ƒx` function menu, the group-by / sort
 * field pickers, and the time-interval combobox. It owns the popover, the
 * open/search state, the filter + Enter-applies-first / Esc-closes keyboard
 * shortcuts, and the grouped, optionally checkable list with an optional
 * create-new row. Each consumer supplies its option data and its own trigger
 * shape (see {@link SearchPopoverMenuProps.trigger}); the trigger's caret is the
 * popover anchor so every menu's beak lines up under its dropdown icon.
 */
export const SearchPopoverMenu: React.FC<SearchPopoverMenuProps> = ({
  options,
  trigger,
  checkable,
  allowCreate,
  keepOpenOnSelect,
  onOpen,
  searchPlaceholder,
  emptyMessage,
  anchorPosition = 'downLeft',
  searchDataTestSubj,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const firstMatchRef = useRef<SearchMenuOption | null>(null);

  const close = () => {
    setIsOpen(false);
    setSearch('');
  };
  const toggleOpen = () =>
    setIsOpen((o) => {
      if (!o) onOpen?.();
      return !o;
    });

  const selectOption = (option: SearchMenuOption) => {
    option.onSelect();
    if (!keepOpenOnSelect) close();
  };
  const create = (value: string) => {
    allowCreate?.onCreate(value);
    if (!keepOpenOnSelect) close();
  };

  const { filtered, allowCreateNow } = useMemo(() => {
    firstMatchRef.current = null;
    const q = search.trim().toLowerCase();
    const items = options.filter((o) => (o.filterText ?? o.key).toLowerCase().includes(q));
    firstMatchRef.current = items[0] ?? null;
    const exact = options.some((o) => (o.filterText ?? o.key).toLowerCase() === q);
    return { filtered: items, allowCreateNow: !!allowCreate && q.length > 0 && !exact };
  }, [search, options, allowCreate]);

  const applyFirst = () => {
    const q = search.trim();
    if (firstMatchRef.current) selectOption(firstMatchRef.current);
    else if (allowCreate && q) create(q);
  };

  const { anchor, leading, wrapperClassName } = trigger(toggleOpen);

  const renderRow = (option: SearchMenuOption) => {
    const asFieldOption = checkable || !!option.leadingIcon;
    const button = (
      <button
        key={option.key}
        type="button"
        className={`plqFnPopover__item${asFieldOption ? ' plqFieldOption' : ''}`}
        onClick={() => selectOption(option)}
        data-test-subj={option.dataTestSubj}
      >
        {option.leadingIcon ? (
          <EuiIcon type={option.leadingIcon} size="s" className="plqFieldOption__check" />
        ) : (
          checkable && (
            <EuiIcon
              type="check"
              size="s"
              className={`plqFieldOption__check${
                option.selected ? '' : ' plqFieldOption__check--hidden'
              }`}
            />
          )
        )}
        {option.label}
        {option.hint != null && <span className="plqFieldOption__hint">{option.hint}</span>}
      </button>
    );
    if (!option.tooltip) return button;
    return (
      <EuiToolTip key={option.key} content={option.tooltip} position="right">
        {button}
      </EuiToolTip>
    );
  };

  const popover = (
    <EuiPopover
      button={anchor}
      isOpen={isOpen}
      closePopover={close}
      panelPaddingSize="none"
      anchorPosition={anchorPosition}
      panelClassName="plqFnPopover"
    >
      <EuiPopoverTitle paddingSize="s">
        <EuiFieldSearch
          compressed
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') applyFirst();
            if (e.key === 'Escape') close();
          }}
          placeholder={searchPlaceholder}
          data-test-subj={searchDataTestSubj}
        />
      </EuiPopoverTitle>
      <div className="plqFnPopover__list">
        {filtered.length === 0 && !allowCreateNow ? (
          <div className="plqFnPopover__empty">{emptyMessage}</div>
        ) : (
          <>
            {filtered.map((option, i) => {
              const header =
                option.group && option.group !== filtered[i - 1]?.group ? (
                  <div key={`${option.group}-header`} className="plqFnPopover__group">
                    {option.group}
                  </div>
                ) : null;
              return (
                <React.Fragment key={option.key}>
                  {header}
                  {renderRow(option)}
                </React.Fragment>
              );
            })}
            {allowCreateNow && (
              <button
                type="button"
                className="plqFnPopover__item plqFieldOption"
                onClick={() => create(search.trim())}
                data-test-subj={allowCreate?.dataTestSubj}
              >
                <EuiIcon type="plus" size="s" className="plqFieldOption__check" />
                {search.trim()}
              </button>
            )}
          </>
        )}
      </div>
    </EuiPopover>
  );

  if (!leading && !wrapperClassName) return popover;
  return (
    <span className={wrapperClassName}>
      {leading}
      {popover}
    </span>
  );
};
