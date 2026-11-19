/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './table.scss';
import { EuiSpacer } from '@elastic/eui';
import { useContext, useEffect, useMemo, useState } from 'react';
import { ReactReduxContext, useSelector } from 'react-redux';
import { DocViewRenderProps } from '../../../types/doc_views_types';
import { DocViewTableRowContainer } from './table_row/table_row_container';
import { selectHideEmptyFields } from '../../../application/utils/state_management/selectors';
import { hasFieldValue } from '../../../utils/has_field_value';
import { Pagination } from '../../data_table/pagination/pagination';

const FIELDS_PER_PAGE = 20;

/** Reads the setting from the store. Split out so it only mounts when a store is present. */
const HideEmptyFieldsFromStore = ({
  children,
}: {
  children: (hideEmptyFields: boolean) => JSX.Element;
}) => children(useSelector(selectHideEmptyFields));

export function DocViewTable(props: DocViewRenderProps) {
  // The standalone `#/doc` route mounts this view outside the explore Redux provider, so the
  // setting is only read when a store is actually available.
  const hasStore = !!useContext(ReactReduxContext);

  if (!hasStore) {
    return <DocViewTableContent {...props} hideEmptyFields={false} />;
  }

  return (
    <HideEmptyFieldsFromStore>
      {(hideEmptyFields) => <DocViewTableContent {...props} hideEmptyFields={hideEmptyFields} />}
    </HideEmptyFieldsFromStore>
  );
}

function DocViewTableContent({
  hit,
  indexPattern,
  filter,
  columns,
  onAddColumn,
  onRemoveColumn,
  hideEmptyFields,
}: DocViewRenderProps & { hideEmptyFields: boolean }) {
  const fields = useMemo(() => {
    const flattened = indexPattern.flattenHit(hit);
    // Drop fields this document has no value for when the setting is enabled.
    return Object.keys(flattened)
      .filter((field) => !hideEmptyFields || hasFieldValue(flattened[field]))
      .sort();
  }, [hit, indexPattern, hideEmptyFields]);
  const [pageIndex, setPageIndex] = useState(0);
  useEffect(() => {
    setPageIndex(0);
  }, [hit]);
  const pageCount = Math.ceil(fields.length / FIELDS_PER_PAGE);
  const activePage = Math.min(pageIndex, Math.max(0, pageCount - 1));
  const startIndex = activePage * FIELDS_PER_PAGE;

  return (
    <>
      <table
        className="table table-condensed exploreDocViewerTable"
        data-test-subj="osdDocViewerTable"
      >
        <tbody>
          {fields.slice(startIndex, startIndex + FIELDS_PER_PAGE).map((field) => {
            return (
              <DocViewTableRowContainer
                key={field}
                hit={hit}
                indexPattern={indexPattern}
                filter={filter}
                columns={columns}
                onAddColumn={onAddColumn}
                onRemoveColumn={onRemoveColumn}
                field={field}
              />
            );
          })}
        </tbody>
      </table>
      {pageCount > 1 && (
        <>
          <EuiSpacer size="s" />
          <Pagination
            pageCount={pageCount}
            activePage={activePage}
            goToPage={setPageIndex}
            startItem={startIndex + 1}
            endItem={Math.min(startIndex + FIELDS_PER_PAGE, fields.length)}
            totalItems={fields.length}
            data-test-subj="osdDocViewerPagination"
          />
        </>
      )}
    </>
  );
}
