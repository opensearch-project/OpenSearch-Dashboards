/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButtonEmpty } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ControlGroup } from '../../../../../components/query_builder';
import { SpanAttributeFilter } from './span_attribute_filter';
import { TraceFilterChip } from './trace_filter_chip';
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
  /** Edit an existing filter in place (never appends). */
  replaceFilter: (
    oldFilter: SpanFilter,
    field: string,
    value: string | number | boolean,
    operator?: '=' | '!='
  ) => void;
  clearAllFilters: () => void;
  setSpanFiltersWithStorage: (filters: SpanFilter[]) => void;
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
  replaceFilter,
  clearAllFilters,
  setSpanFiltersWithStorage,
}) => {
  const chipFilters = spanFilters.filter((filter) => !isSpecialFilter(filter));

  return (
    <div className="exploreTraceFilterBar" data-test-subj="traceFilterBar">
      <ControlGroup
        label={i18n.translate('explore.traceView.filters.groupLabel', {
          defaultMessage: 'Filters',
        })}
        className="plqGroup--wrap exploreTraceFilterBar__group"
        dataTestSubj="traceFilterGroup"
      >
        {/* Persistent entry controls: add/edit each facet. */}
        <SpanStatusFilter
          variant="button"
          spanFilters={spanFilters}
          setSpanFiltersWithStorage={setSpanFiltersWithStorage}
        />
        <SpanDurationFilter
          variant="button"
          spans={spans}
          spanFilters={spanFilters}
          setSpanFiltersWithStorage={setSpanFiltersWithStorage}
        />
        <SpanAttributeFilter fields={datasetFields} spans={spans} onAddFilter={addSpanFilter} />

        {/* Applied filters render as uniform pills to the right of the controls:
            status + duration facets first, then the attribute chips. */}
        <SpanStatusFilter
          variant="pill"
          spanFilters={spanFilters}
          setSpanFiltersWithStorage={setSpanFiltersWithStorage}
        />
        <SpanDurationFilter
          variant="pill"
          spans={spans}
          spanFilters={spanFilters}
          setSpanFiltersWithStorage={setSpanFiltersWithStorage}
        />
        {chipFilters.map((filter, index) => (
          <TraceFilterChip
            key={`${filter.field}-${index}`}
            filter={filter}
            fields={datasetFields}
            spans={spans}
            removeFilter={removeFilter}
            replaceFilter={replaceFilter}
          />
        ))}
        {spanFilters.length > 0 && (
          <>
            <span className="exploreTraceFilterBar__spacer" />
            <EuiButtonEmpty
              size="xs"
              color="text"
              onClick={clearAllFilters}
              data-test-subj="clear-all-filters-button"
            >
              {i18n.translate('explore.traceView.filters.clearAll', {
                defaultMessage: 'Clear all',
              })}
            </EuiButtonEmpty>
          </>
        )}
      </ControlGroup>
    </div>
  );
};
