/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ControlGroup, FieldPill } from '../../../../../components/query_builder';
import { SpanAttributeFilter } from './span_attribute_filter';
import { SpanStatusFilter } from './span_detail_tables/span_status_filter';
import { SpanDurationFilter } from './span_detail_tables/span_duration_filter';
import { DURATION_MIN_FILTER_FIELD } from './span_detail_tables/utils';
import { SpanFilter, DatasetField } from '../../trace_view';
import './trace_filter_bar.scss';

export interface TraceFilterBarProps {
  spanFilters: SpanFilter[];
  datasetFields: DatasetField[];
  /** Whole-trace spans (pre-filter), for attribute-value + duration presets. */
  spans: Array<Record<string, any>>;
  addSpanFilter: (field: string, value: string | number | boolean, operator?: '=' | '!=') => void;
  removeFilter: (filter: SpanFilter) => void;
  clearAllFilters: () => void;
  setSpanFiltersWithStorage: (filters: SpanFilter[]) => void;
  getFilterDisplayText: (filter: SpanFilter) => string;
}

// The status/duration quick filters own their own popover UI (Error/OK/Unset,
// p90/p99) and surface their active state on their own trigger, so they are NOT
// re-rendered as chips. Everything else (serviceName + dataset attributes) shows
// as an editable-model chip.
const isSpecialFilter = (filter: SpanFilter): boolean =>
  filter.field === 'isError' ||
  filter.field === 'status.code' ||
  filter.field === DURATION_MIN_FILTER_FIELD;

/**
 * Trace filter bar styled after the logs "visual query builder": a "Filters"
 * fieldset group holding the active attribute filters as pill chips plus the
 * add / status / duration controls, with a Clear-all on the right.
 */
export const TraceFilterBar: React.FC<TraceFilterBarProps> = ({
  spanFilters,
  datasetFields,
  spans,
  addSpanFilter,
  removeFilter,
  clearAllFilters,
  setSpanFiltersWithStorage,
  getFilterDisplayText,
}) => {
  const chipFilters = spanFilters.filter((filter) => !isSpecialFilter(filter));

  return (
    <div className="exploreTraceFilterBar" data-test-subj="traceFilterBar">
      <EuiFlexGroup
        alignItems="center"
        justifyContent="spaceBetween"
        gutterSize="s"
        responsive={false}
      >
        <EuiFlexItem>
          <ControlGroup
            label={i18n.translate('explore.traceView.filters.groupLabel', {
              defaultMessage: 'Filters',
            })}
            className="plqGroup--wrap"
            dataTestSubj="traceFilterGroup"
          >
            {chipFilters.map((filter, index) => (
              <FieldPill
                key={`${filter.field}-${index}`}
                label={getFilterDisplayText(filter)}
                onRemove={() => removeFilter(filter)}
                removeAriaLabel={i18n.translate('explore.traceView.filters.removeFilter', {
                  defaultMessage: 'Remove filter',
                })}
                dataTestSubj={`trace-filter-pill-${filter.field}`}
              />
            ))}
            <SpanAttributeFilter fields={datasetFields} spans={spans} onAddFilter={addSpanFilter} />
            <SpanStatusFilter
              spanFilters={spanFilters}
              setSpanFiltersWithStorage={setSpanFiltersWithStorage}
            />
            <SpanDurationFilter
              spans={spans}
              spanFilters={spanFilters}
              setSpanFiltersWithStorage={setSpanFiltersWithStorage}
            />
          </ControlGroup>
        </EuiFlexItem>
        {spanFilters.length > 0 && (
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="xs"
              onClick={clearAllFilters}
              data-test-subj="clear-all-filters-button"
            >
              {i18n.translate('explore.traceView.filters.clearAll', {
                defaultMessage: 'Clear all',
              })}
            </EuiButtonEmpty>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </div>
  );
};
