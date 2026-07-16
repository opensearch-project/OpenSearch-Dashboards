/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import classNames from 'classnames';
import { i18n } from '@osd/i18n';
import { EuiButtonIcon, EuiIcon } from '@elastic/eui';
import { SearchPopoverMenu, SearchMenuOption } from './search_popover_menu';

/**
 * The "over time" entry pinned to the top of the popover — plain-language time
 * grouping (compiled to a `span(...)` behind the scenes). When supplied, it
 * renders first under an "Over time" header; picking it calls `onSelect` and
 * closes the popover. The group-by control passes this so time grouping is added
 * from the same popover as the fields, rather than a standalone clock button. It
 * is omitted once a time grouping already exists (PPL allows only one span).
 */
interface OverTimeEntry {
  /** Natural-language hint shown after the label (e.g. "every 1h"). */
  hint: string;
  /** The real syntax, shown as the row's tooltip (e.g. "span(@timestamp, 1h)"). */
  tooltip: string;
  onSelect: () => void;
}

interface FieldMenuBaseProps {
  /** Field names to choose from. */
  options: string[];
  /** Placeholder shown in the trigger when nothing is selected. */
  placeholder?: string;
  /** Class applied to the default trigger's wrapper (styles the token). */
  triggerClassName?: string;
  /**
   * Custom trigger content for the group-by control's non-empty state: the
   * consumer's removable pills (each with its own ✕). The menu renders these as
   * the trigger's `leading` content inside a `plqPills` row and appends its own
   * caret as the popover anchor, so the panel hangs from the dropdown icon rather
   * than centering under the wide pills box. When omitted, the shared single
   * label + caret button is shown as one click target (the sort-column token and
   * the empty "Everything ⌄" group-by state), with the popover anchored under it.
   */
  renderTrigger?: (onToggle: () => void) => React.ReactNode;
  /** aria-label for the caret button rendered as the popover anchor. */
  caretAriaLabel?: string;
  /** Optional plain-language time-grouping entry pinned to the top of the list. */
  overTime?: OverTimeEntry;
  dataTestSubj?: string;
}

interface SingleFieldMenuProps extends FieldMenuBaseProps {
  multi?: false;
  /** The selected field name (empty string when none). */
  value: string;
  /** Called with the chosen field. */
  onChange: (field: string) => void;
}

interface MultiFieldMenuProps extends FieldMenuBaseProps {
  multi: true;
  /** The selected field names. */
  value: string[];
  /** Called with the full next selection whenever it changes. */
  onChange: (fields: string[]) => void;
}

type FieldMenuProps = SingleFieldMenuProps | MultiFieldMenuProps;

/**
 * A field picker rendered as a search-first popover (the shared
 * {@link SearchPopoverMenu}) rather than an inline combobox whose dropdown is
 * clipped to a narrow control width. The trigger shows the current selection as
 * plain text; opening it reveals a filterable, readable list. In `multi` mode
 * each row toggles (a check marks selected fields and the popover stays open); in
 * single mode picking a field applies it and closes. Fields not already in the
 * list can be added by typing a new value and pressing Enter.
 */
export const FieldMenu: React.FC<FieldMenuProps> = (props) => {
  const {
    options,
    placeholder,
    triggerClassName,
    renderTrigger,
    caretAriaLabel,
    overTime,
    dataTestSubj,
  } = props;

  const selectedSet = useMemo(
    () => new Set(props.multi ? props.value : props.value ? [props.value] : []),
    [props.multi, props.value]
  );

  const choose = (field: string) => {
    if (props.multi) {
      const next = selectedSet.has(field)
        ? props.value.filter((f) => f !== field)
        : [...props.value, field];
      props.onChange(next);
    } else {
      props.onChange(field);
    }
  };

  const menuOptions = useMemo<SearchMenuOption[]>(() => {
    const rows: SearchMenuOption[] = [];
    if (overTime) {
      rows.push({
        key: '__overTime',
        filterText: `over time ${overTime.hint}`,
        group: i18n.translate('explore.pplBuilder.overTimeGroup', { defaultMessage: 'Over time' }),
        leadingIcon: 'clock',
        label: i18n.translate('explore.pplBuilder.overTime', { defaultMessage: 'over time' }),
        hint: overTime.hint,
        tooltip: overTime.tooltip,
        onSelect: overTime.onSelect,
        dataTestSubj: 'pplBuilderGroupByOverTime',
      });
    }
    const fieldsGroup = overTime
      ? i18n.translate('explore.pplBuilder.fieldsGroup', { defaultMessage: 'Fields' })
      : undefined;
    for (const field of options) {
      rows.push({
        key: field,
        label: field,
        group: fieldsGroup,
        selected: selectedSet.has(field),
        onSelect: () => choose(field),
        dataTestSubj: `pplBuilderFieldOption-${field}`,
      });
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, overTime, selectedSet]);

  const selectedLabel = props.multi ? props.value.join(', ') : props.value;

  return (
    <SearchPopoverMenu
      options={menuOptions}
      checkable
      keepOpenOnSelect={props.multi}
      allowCreate={{
        onCreate: choose,
        dataTestSubj: 'pplBuilderFieldOptionCreate',
      }}
      searchPlaceholder={i18n.translate('explore.pplBuilder.searchFields', {
        defaultMessage: 'Search fields…',
      })}
      emptyMessage={i18n.translate('explore.pplBuilder.noMatchingField', {
        defaultMessage: 'No matching field',
      })}
      searchDataTestSubj={dataTestSubj ? `${dataTestSubj}-search` : undefined}
      trigger={(toggle) => {
        if (renderTrigger) {
          return {
            wrapperClassName: 'plqPills',
            leading: renderTrigger(toggle),
            anchor: (
              <EuiButtonIcon
                className="plqPills__caret"
                iconType="arrowDown"
                color="text"
                size="s"
                aria-label={caretAriaLabel}
                onClick={toggle}
              />
            ),
          };
        }
        return {
          anchor: (
            <button
              type="button"
              className={triggerClassName}
              onClick={toggle}
              aria-label={caretAriaLabel ?? placeholder}
              data-test-subj={dataTestSubj}
            >
              <span
                className={classNames('plqAggTrigger__label', {
                  'plqAggTrigger__label--placeholder': !selectedLabel,
                })}
              >
                {selectedLabel || placeholder}
              </span>
              <EuiIcon type="arrowDown" size="s" className="plqAggTrigger__caret" />
            </button>
          ),
        };
      }}
    />
  );
};
