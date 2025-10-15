/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row } from '@tanstack/react-table';
import { DocViewer } from '../../../doc_viewer/doc_viewer';
import { getDocViewsRegistry } from '../../../../application/legacy/discover/opensearch_dashboards_services';
import { selectVisibleColumnNames } from '../../../../application/utils/state_management/selectors';
import { useDatasetContext } from '../../../../application/context';
import { setExpandedRowState } from '../../../../application/utils/state_management/slices';

export interface ExploreResultsTableExpandedDocumentProps {
  row: Row<any>;
}

export const ExploreResultsTableExpandedDocument = ({
  row,
}: ExploreResultsTableExpandedDocumentProps) => {
  const dispatch = useDispatch();
  const visibleColumns = useSelector(selectVisibleColumnNames);
  const docViewsRegistry = useMemo(getDocViewsRegistry, []);
  const { dataset } = useDatasetContext();

  // TODO: WORK ON THIS!
  const collapseExpandedRow = () => {
    dispatch(setExpandedRowState);
  };

  if (!dataset) {
    return null;
  }

  return (
    <div className="exploreResultsTableExpandedDocument">
      <DocViewer
        renderProps={{ hit: row.original, columns: visibleColumns, indexPattern: dataset }}
        docViewsRegistry={docViewsRegistry}
      />
    </div>
  );
};
