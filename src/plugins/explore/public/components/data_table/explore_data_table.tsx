/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './explore_data_table.scss';

import { i18n } from '@osd/i18n';
import { useCallback, useLayoutEffect, useMemo, useRef, memo } from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { useDispatch, useSelector } from 'react-redux';
import { ExploreFlavor, SAMPLE_SIZE_SETTING } from '../../../common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { UI_SETTINGS } from '../../../../data/public';
import { DocViewFilterFn } from '../../types/doc_views_types';
import { DataTable } from './data_table';
import { QueryWarningsCallout } from './query_warnings_callout';
import { getDocViewsRegistry } from '../../application/legacy/discover/opensearch_dashboards_services';
import { ExploreServices } from '../../types';
import {
  selectExpandAllJson,
  selectSavedSearch,
  selectShowJsonFormat,
  selectWrapCellText,
} from '../../application/utils/state_management/selectors';
import { JsonTreeSettingsContext } from '../json_tree/json_tree';
import { RootState } from '../../application/utils/state_management/store';
import { defaultPrepareQueryString } from '../../application/utils/state_management/actions/query_actions';
import { resultsCache } from '../../application/utils/state_management/slices';
import { useChangeQueryEditor } from '../../application/hooks';
import { useDatasetContext } from '../../application/context';
import { addColumn, removeColumn } from '../../application/utils/state_management/slices';
import { useFlavorId } from '../../helpers/use_flavor_id';
import { useDisplayedColumns } from '../../helpers/use_displayed_columns';

// The CSS selectors below follow DataTable's markup in data_table.tsx and expanded_table_row.tsx.

// Where rows start showing on screen, at the bottom of the main table's sticky column header.
const visibleRowsTop = (container: HTMLElement) =>
  container.querySelector('[data-test-subj="docTable"] > thead')?.getBoundingClientRect().bottom ??
  container.getBoundingClientRect().top;

// The row the reader is on, the first one still showing below the column header. A sliver of a pixel
// or less does not count, since moving a row to the top on an earlier switch can leave one behind. An
// expanded row counts as the log row it expands, so that log row stays in view above its details.
const rowBeingRead = (container: HTMLElement | null) => {
  if (!container) return undefined;
  const cutoff = visibleRowsTop(container) + 1;
  const row = Array.from(
    container.querySelectorAll('[data-test-subj="docTable"] > tbody > tr')
  ).find((candidate) => candidate.getBoundingClientRect().bottom > cutoff);
  const detailsCell = row?.querySelector(':scope > [data-test-subj="osdDocTableDetailsParent"]');
  return (detailsCell && row?.previousElementSibling) || row;
};

const ExploreDataTableComponent = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { uiSettings } = services;

  const { onAddFilter } = useChangeQueryEditor();
  const savedSearch = useSelector(selectSavedSearch);
  const wrapCellText = useSelector(selectWrapCellText);
  const showJsonFormat = useSelector(selectShowJsonFormat);
  const expandAllJson = useSelector(selectExpandAllJson);
  const jsonTreeSettings = useMemo(
    () => ({ showJsonFormat, expandAllJson }),
    [showJsonFormat, expandAllJson]
  );
  const { dataset } = useDatasetContext();

  // Get rows for the DataTable (hook handles column processing)
  const query = useSelector((state: RootState) => state.query);
  const cacheKey = useMemo(() => defaultPrepareQueryString(query), [query]);
  // metadata subscribes to Redux for reactivity; full hits are read from resultsCache.
  // The cache is guaranteed to be populated before this selector fires (see store.ts middleware).
  const metadata = useSelector((state: RootState) => state.results[cacheKey]);
  const rawResults = metadata ? (resultsCache.get(cacheKey) ?? null) : null;
  const rows = rawResults?.hits?.hits || [];
  const warnings = metadata?.warnings ?? [];

  const flavorId = useFlavorId();
  const expandedTableHeader = useMemo(() => {
    if (flavorId === ExploreFlavor.Traces) {
      return i18n.translate('explore.dataTable.expandedRow.spanHeading', {
        defaultMessage: 'Expanded span',
      });
    }
    return i18n.translate('explore.dataTable.expandedRow.documentHeading', {
      defaultMessage: 'Expanded document',
    });
  }, [flavorId]);

  // Use shared hook to ensure DataTable columns match CSV export columns
  const tableColumns = useDisplayedColumns({ includeFieldCounts: true });

  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  // A JSON switch can change the height of every row, so the row being read is found before the
  // cells redraw and moved to the top of the table after, before the browser paints. It is found
  // during render, since that is the last point this component can still see the old layout.
  const previousJsonTreeSettingsRef = useRef(jsonTreeSettings);
  const rowToMoveToTopRef = useRef<Element>();
  if (previousJsonTreeSettingsRef.current !== jsonTreeSettings) {
    previousJsonTreeSettingsRef.current = jsonTreeSettings;
    rowToMoveToTopRef.current = rowBeingRead(containerRef.current);
  }
  useLayoutEffect(() => {
    const row = rowToMoveToTopRef.current;
    const container = containerRef.current;
    rowToMoveToTopRef.current = undefined;
    if (!row?.isConnected || !container) return;
    container.scrollTop += row.getBoundingClientRect().top - visibleRowsTop(container);
  }, [jsonTreeSettings]);

  const docViewsRegistry = useMemo(() => getDocViewsRegistry(), []);

  const dispatch = useDispatch();
  const onAddColumn = useCallback(
    (col: string) => {
      dispatch(addColumn({ column: col }));
    },
    [dispatch]
  );

  const onRemoveColumn = useCallback(
    (col: string) => {
      dispatch(removeColumn(col));
    },
    [dispatch]
  );

  return (
    <div
      data-render-complete={true}
      data-shared-item=""
      data-title={savedSearch || ''}
      data-description={savedSearch || ''}
      data-test-subj="discoverTable"
      className="explore-table-container eui-xScrollWithShadows"
      ref={containerRef}
    >
      <QueryWarningsCallout warnings={warnings} />
      <EuiFlexGroup
        direction="column"
        gutterSize="xs"
        justifyContent="center"
        className="explore-table-flex-group"
      >
        <EuiFlexItem grow={true}>
          <JsonTreeSettingsContext.Provider value={jsonTreeSettings}>
            <DataTable
              columns={tableColumns}
              dataset={dataset!}
              rows={rows}
              docViewsRegistry={docViewsRegistry}
              sampleSize={uiSettings.get(SAMPLE_SIZE_SETTING)}
              isShortDots={uiSettings.get(UI_SETTINGS.SHORT_DOTS_ENABLE)}
              onFilter={onAddFilter as DocViewFilterFn}
              scrollToTop={scrollToTop}
              onAddColumn={onAddColumn}
              onRemoveColumn={onRemoveColumn}
              expandedTableHeader={expandedTableHeader}
              wrapCellText={wrapCellText}
            />
          </JsonTreeSettingsContext.Provider>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

export const ExploreDataTable = memo(ExploreDataTableComponent);
