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

export interface SearchMenuOption {
  key: string;
  label: React.ReactNode;
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
  onOpen?: () => void;
  searchPlaceholder: string;
  emptyMessage: string;
  anchorPosition?: EuiPopoverProps['anchorPosition'];
  searchDataTestSubj?: string;
}

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
