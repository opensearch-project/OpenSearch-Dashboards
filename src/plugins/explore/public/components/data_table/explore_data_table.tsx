/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import {
  DEFAULT_COLUMNS_SETTING,
  DOC_HIDE_TIME_COLUMN_SETTING,
  MODIFY_COLUMNS_ON_SWITCH,
  SAMPLE_SIZE_SETTING,
} from '../../../common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { IndexPatternField, opensearchFilters, UI_SETTINGS } from '../../../../data/public';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../types/doc_views_types';
import { DataTable } from './data_table';
import {
  addColumn,
  removeColumn,
  useDispatch,
  useSelector,
} from '../../application/legacy/discover/application/utils/state_management';
import { DiscoverViewServices } from '../../application/legacy/discover/build_services';
import { useDiscoverContext } from '../../application/legacy/discover/application/view_components/context';
import { popularizeField } from '../../application/legacy/discover/application/helpers/popularize_field';
import { buildColumns } from '../../application/legacy/discover/application/utils/columns';
import { filterColumns } from '../../application/legacy/discover/application/view_components/utils/filter_columns';
import { getLegacyDisplayedColumns } from '../../helpers/data_table_helper';
import { getDocViewsRegistry } from '../../application/legacy/discover/opensearch_dashboards_services';

interface Props {
  rows?: Array<OpenSearchSearchHit<Record<string, any>>>;
  scrollToTop?: () => void;
}

export const ExploreDataTable = ({ rows, scrollToTop }: Props) => {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const {
    uiSettings,
    data: {
      query: { filterManager },
    },
    capabilities,
    indexPatterns,
  } = services;

  const { indexPattern, savedSearch } = useDiscoverContext();

  const { columns } = useSelector((state) => {
    const stateColumns = state.logs?.columns;
    // check if state columns is not undefined, otherwise use buildColumns
    return {
      columns: stateColumns !== undefined ? stateColumns : buildColumns([]),
    };
  });

  const tableColumns = useMemo(() => {
    if (indexPattern == null) {
      return [];
    }

    const filteredColumns = filterColumns(
      columns,
      indexPattern,
      uiSettings.get(DEFAULT_COLUMNS_SETTING),
      uiSettings.get(MODIFY_COLUMNS_ON_SWITCH)
    );

    let adjustedColumns = buildColumns(filteredColumns);
    // Handle the case where all fields/columns are removed except the time-field one
    if (adjustedColumns.length === 1 && adjustedColumns[0] === indexPattern.timeFieldName) {
      adjustedColumns = [...adjustedColumns, '_source'];
    }

    const displayedColumns = getLegacyDisplayedColumns(
      adjustedColumns,
      indexPattern,
      uiSettings.get(UI_SETTINGS.SHORT_DOTS_ENABLE),
      uiSettings.get(DOC_HIDE_TIME_COLUMN_SETTING)
    );

    return displayedColumns;
  }, [columns, indexPattern, uiSettings]);

  const docViewsRegistry = getDocViewsRegistry();

  const dispatch = useDispatch();
  const onAddColumn = (col: string) => {
    if (indexPattern && capabilities.discover?.save) {
      popularizeField(indexPattern, col, indexPatterns);
    }

    dispatch(addColumn({ column: col }));
  };
  const onRemoveColumn = (col: string) => {
    if (indexPattern && capabilities.discover?.save) {
      popularizeField(indexPattern, col, indexPatterns);
    }

    dispatch(removeColumn(col));
  };

  const onAddFilter = useCallback(
    (field: string | IndexPatternField, values: string, operation: '+' | '-') => {
      if (!indexPattern) return;

      const newFilters = opensearchFilters.generateFilters(
        filterManager,
        field,
        values,
        operation,
        indexPattern.id ?? ''
      );
      return filterManager.addFilters(newFilters);
    },
    [filterManager, indexPattern]
  );

  if (indexPattern === undefined) {
    // TODO: handle better
    return null;
  }

  if (!rows || rows.length === 0) {
    // TODO: handle better
    return <div>{'loading...'}</div>;
  }

  return (
    <div
      data-render-complete={true}
      data-shared-item=""
      data-title={savedSearch?.id ? savedSearch.title : ''}
      data-description={savedSearch?.id ? savedSearch.description : ''}
      data-test-subj="discoverTable"
      className="eui-xScrollWithShadows"
      style={{ height: '100%' }}
    >
      <DataTable
        columns={tableColumns}
        indexPattern={indexPattern}
        rows={rows}
        docViewsRegistry={docViewsRegistry}
        sampleSize={uiSettings.get(SAMPLE_SIZE_SETTING)}
        isShortDots={uiSettings.get(UI_SETTINGS.SHORT_DOTS_ENABLE)}
        onAddColumn={onAddColumn}
        onFilter={onAddFilter as DocViewFilterFn}
        onRemoveColumn={onRemoveColumn}
        scrollToTop={scrollToTop}
      />
    </div>
  );
};
