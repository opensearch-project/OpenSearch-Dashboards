/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  EuiFieldSearch,
  EuiIcon,
  EuiLoadingSpinner,
  EuiPopover,
  EuiPopoverTitle,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';

const SEARCH_DEBOUNCE_MS = 400;

export interface SearchMenuOption {
  key: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  filterText?: string;
  group?: string;
  selected?: boolean;
  leadingIcon?: string;
  hint?: React.ReactNode;
  tooltip?: string;
  onSelect: () => void;
  dataTestSubj?: string;
}

export interface TriggerParts {
  anchor: React.ReactElement;
  leading?: React.ReactNode;
  wrapperClassName?: string;
}

interface SearchPopoverMenuProps {
  options: SearchMenuOption[];
  trigger: (toggle: () => void) => TriggerParts;
  checkable?: boolean;
  allowCreate?: {
    onCreate: (value: string) => void;
    dataTestSubj?: string;
  };
  keepOpenOnSelect?: boolean;
  // Open the popover (and focus its search box) once on mount. For callers that
  // reveal the menu in response to a user action and want it ready to type in.
  autoOpen?: boolean;
  onOpen?: () => void;
  // Fires (debounced) with the trimmed search text as the user types, for
  // callers that fetch options server-side. Empty string signals "cleared".
  onSearchChange?: (search: string) => void;
  // Set while a server-side option fetch is in flight; drives the search-box
  // spinner and the "Loading…" row.
  loading?: boolean;
  searchPlaceholder: string;
  emptyMessage: string;
  searchDataTestSubj?: string;
}

export const SearchPopoverMenu: React.FC<SearchPopoverMenuProps> = ({
  options,
  trigger,
  checkable,
  allowCreate,
  keepOpenOnSelect,
  autoOpen,
  onOpen,
  onSearchChange,
  loading,
  searchPlaceholder,
  emptyMessage,
  searchDataTestSubj,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const firstMatchRef = useRef<SearchMenuOption | null>(null);

  useEffect(() => {
    if (autoOpen) {
      setIsOpen(true);
      onOpen?.();
    }
    // Run once on mount: autoOpen reflects the initial reveal intent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce the server-side search notification so a burst of keystrokes
  // fires at most one fetch. Latest callback is read via ref to avoid
  // re-arming the timer when the parent passes a new function identity.
  const onSearchChangeRef = useRef(onSearchChange);
  onSearchChangeRef.current = onSearchChange;
  const changeSearch = (next: string) => {
    setSearch(next);
    if (!onSearchChangeRef.current) return;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      onSearchChangeRef.current?.(next.trim());
    }, SEARCH_DEBOUNCE_MS);
  };
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(
    () => () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    },
    []
  );

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
    // Keep the popover open for multi-select, but always clear the search so the
    // next typed value starts fresh rather than appending to the previous text.
    // changeSearch (not setSearch) so a server-side option source is asked to
    // restore its unfiltered list.
    if (keepOpenOnSelect) changeSearch('');
    else close();
  };
  const create = (value: string) => {
    allowCreate?.onCreate(value);
    if (keepOpenOnSelect) setSearch('');
    else close();
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
        {option.description != null ? (
          <span className="plqFnPopover__labeled">
            <strong>{option.label}</strong>
            <span className="plqFnPopover__desc">{option.description}</span>
          </span>
        ) : (
          option.label
        )}
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
      anchorPosition="downLeft"
      panelClassName="plqFnPopover"
    >
      <EuiPopoverTitle paddingSize="s">
        <EuiFieldSearch
          compressed
          autoFocus
          isLoading={loading}
          value={search}
          onChange={(e) => changeSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') applyFirst();
            if (e.key === 'Escape') close();
          }}
          placeholder={searchPlaceholder}
          data-test-subj={searchDataTestSubj}
        />
      </EuiPopoverTitle>
      <div className="plqFnPopover__list">
        {loading && filtered.length === 0 ? (
          <div className="plqFnPopover__empty plqFnPopover__loading">
            <EuiLoadingSpinner size="s" />
            {i18n.translate('explore.pplBuilder.loadingValues', {
              defaultMessage: 'Loading…',
            })}
          </div>
        ) : filtered.length === 0 && !allowCreateNow ? (
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
