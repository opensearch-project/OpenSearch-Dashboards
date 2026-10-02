/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './table.scss';
import { useContext } from 'react';
import { ReactReduxContext, useSelector } from 'react-redux';
import { DocViewRenderProps } from '../../../types/doc_views_types';
import { DocViewTableRowContainer } from './table_row/table_row_container';
import { selectHideEmptyFields } from '../../../application/utils/state_management/selectors';
import { hasFieldValue } from '../../../utils/has_field_value';

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
  const flattened = indexPattern.flattenHit(hit);

  return (
    <table
      className="table table-condensed exploreDocViewerTable"
      data-test-subj="osdDocViewerTable"
    >
      <tbody>
        {Object.keys(flattened)
          // Drop the fields this document has no value for, so an expanded row shows only
          // what the document actually carries.
          .filter((field) => !hideEmptyFields || hasFieldValue(flattened[field]))
          .sort()
          .map((field) => {
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
  );
}
