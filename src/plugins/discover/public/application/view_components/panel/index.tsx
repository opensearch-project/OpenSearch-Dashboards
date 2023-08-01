/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ViewProps } from '../../../../../data_explorer/public';
import {
  addColumn,
  removeColumn,
  reorderColumn,
  useDispatch,
  useSelector,
} from '../../utils/state_management';
import { DiscoverSidebar } from '../../components/sidebar';
import { useDiscoverContext } from '../context';
import { SearchData } from '../utils/use_search';

// eslint-disable-next-line import/no-default-export
export default function DiscoverPanel(props: ViewProps) {
  const { data$, indexPattern } = useDiscoverContext();
  const [fetchState, setFetchState] = useState<SearchData>(data$.getValue());

  const { columns } = useSelector((state) => ({
    columns: state.discover.columns,
    indexPatternId: state.metadata.indexPattern,
  }));
  const dispatch = useDispatch();

  useEffect(() => {
    const subscription = data$.subscribe((next) => {
      setFetchState(next);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [data$, fetchState]);

  return (
    <DiscoverSidebar
      columns={columns || []}
      fieldCounts={fetchState.fieldCounts || {}}
      hits={fetchState.rows || []}
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
}
