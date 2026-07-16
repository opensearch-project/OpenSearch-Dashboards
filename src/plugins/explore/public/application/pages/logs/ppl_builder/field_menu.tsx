/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import classNames from 'classnames';
import { i18n } from '@osd/i18n';
import { EuiButtonIcon, EuiIcon } from '@elastic/eui';
import { SearchPopoverMenu, SearchMenuOption } from './search_popover_menu';

interface OverTimeEntry {
  hint: string;
  tooltip: string;
  onSelect: () => void;
}

interface FieldMenuBaseProps {
  options: string[];
  placeholder?: string;
  triggerClassName?: string;
  renderTrigger?: (onToggle: () => void) => React.ReactNode;
  caretAriaLabel?: string;
  overTime?: OverTimeEntry;
  dataTestSubj?: string;
}

interface SingleFieldMenuProps extends FieldMenuBaseProps {
  multi?: false;
  value: string;
  onChange: (field: string) => void;
}

interface MultiFieldMenuProps extends FieldMenuBaseProps {
  multi: true;
  value: string[];
  onChange: (fields: string[]) => void;
}

type FieldMenuProps = SingleFieldMenuProps | MultiFieldMenuProps;

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
