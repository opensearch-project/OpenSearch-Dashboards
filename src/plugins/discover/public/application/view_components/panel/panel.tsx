/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import {
  addColumn,
  removeColumn,
  reorderColumn,
  useDispatch,
  useSelector,
} from '../../utils/state_management';
import { DiscoverServices } from '../../../build_services';
import { DiscoverSidebar } from '../../components/sidebar';
import { IndexPattern } from '../../../opensearch_dashboards_services';

export const Panel = () => {
  const { indexPatternId, columns } = useSelector((state) => ({
    columns: state.discover.columns,
    indexPatternId: state.metadata.indexPattern,
  }));
  const dispatch = useDispatch();
  const [indexPattern, setIndexPattern] = useState<IndexPattern>();

  const { services } = useOpenSearchDashboards<DiscoverServices>();

  useEffect(() => {
    const fetchIndexPattern = async () => {
      const currentIndexPattern = await services.data.indexPatterns.get(indexPatternId || '');
      setIndexPattern(currentIndexPattern);
    };
    fetchIndexPattern();
  }, [indexPatternId, services.data.indexPatterns]);

  return (
    <DiscoverSidebar
      columns={columns || []}
      fieldCounts={
        // TODO: this is a hack to get the sidebar to render. Will be fixed when the table and its associated datafetching is added.
        indexPattern?.fields.reduce(
          (acc, field) => ({ ...acc, [field.name]: 1 }),
          {} as Record<string, number>
        ) || {}
      }
      hits={[]}
      onAddField={(fieldName, index) => {
        dispatch(
          addColumn({
            column: fieldName,
            index,
          })
        );
      }}
      onRemoveField={(fieldName) => {
        dispatch(removeColumn(fieldName));
      }}
      onReorderFields={(source, destination) => {
        dispatch(
          reorderColumn({
            source,
            destination,
          })
        );
      }}
      selectedIndexPattern={indexPattern}
      onAddFilter={() => {}}
    />
  );
};
