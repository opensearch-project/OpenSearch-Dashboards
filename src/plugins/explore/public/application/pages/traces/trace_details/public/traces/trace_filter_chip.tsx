/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { RemoveButton } from '../../../../../components/query_builder';
import { SpanAttributeFilter } from './span_attribute_filter';
import { SpanFilter, DatasetField } from '../../trace_view';

export interface TraceFilterChipProps {
  filter: SpanFilter;
  fields: DatasetField[];
  spans: Array<Record<string, any>>;
  addSpanFilter: (field: string, value: string | number | boolean, operator?: '=' | '!=') => void;
  removeFilter: (filter: SpanFilter) => void;
}

/**
 * An editable filter as a segmented chip — field · operator · value · × — styled
 * like the logs visual query builder's `.plqWhereChip`. Field and value segments
 * open the edit popover (SpanAttributeFilter, prefilled); the operator segment
 * toggles = ⇄ ≠ in place; × removes.
 */
export const TraceFilterChip: React.FC<TraceFilterChipProps> = ({
  filter,
  fields,
  spans,
  addSpanFilter,
  removeFilter,
}) => {
  const operator = filter.operator === '!=' ? '!=' : '=';
  const flipped = operator === '!=' ? '=' : '!=';

  // Apply an edit: if the field changed, drop the old filter first (addSpanFilter
  // only replaces same-field entries).
  const onReplace = (field: string, value: string | number | boolean, op: '=' | '!=') => {
    if (field !== filter.field) removeFilter(filter);
    addSpanFilter(field, value, op);
  };

  const removeLabel = i18n.translate('explore.traceView.filters.removeFilter', {
    defaultMessage: 'Remove filter',
  });

  return (
    <SpanAttributeFilter
      fields={fields}
      spans={spans}
      onAddFilter={onReplace}
      initial={{ field: filter.field, value: String(filter.value), operator }}
      applyLabel={i18n.translate('explore.traceView.filters.update', { defaultMessage: 'Update' })}
      renderTrigger={(toggle) => (
        <span className="plqWhereChip" data-test-subj={`trace-filter-chip-${filter.field}`}>
          <button
            type="button"
            className="plqWhereChip__field"
            onClick={toggle}
            title={filter.field}
          >
            <span className="plqWhereChip__fieldText">{filter.field}</span>
            <span className="plqWhereChip__caret">▾</span>
          </button>
          <button
            type="button"
            className="plqWhereChip__op"
            onClick={() => addSpanFilter(filter.field, filter.value, flipped)}
            title={i18n.translate('explore.traceView.filters.toggleOperator', {
              defaultMessage: 'Toggle = / ≠',
            })}
            data-test-subj={`trace-filter-op-${filter.field}`}
          >
            {operator === '!=' ? '≠' : '='}
          </button>
          <button
            type="button"
            className="plqWhereChip__val"
            onClick={toggle}
            title={String(filter.value)}
          >
            <span className="plqWhereChip__valText">{String(filter.value)}</span>
            <span className="plqWhereChip__caret">▾</span>
          </button>
          <RemoveButton
            variant="chip"
            ariaLabel={removeLabel}
            onClick={() => removeFilter(filter)}
            dataTestSubj={`trace-filter-remove-${filter.field}`}
          />
        </span>
      )}
    />
  );
};
