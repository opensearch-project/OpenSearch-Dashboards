/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, EuiPagination, EuiTextColor } from '@elastic/eui';
import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import './_pagination.scss';

interface Props {
  pageCount: number;
  activePage: number;
  goToPage: (page: number) => void;
  startItem: number;
  endItem: number;
  totalItems?: number;
  sampleSize: number;
}

export const Pagination = ({
  pageCount,
  activePage,
  goToPage,
  startItem,
  endItem,
  totalItems = 0,
  sampleSize,
}: Props) => {
  return (
    <EuiFlexGroup
      className="osdDocTable_pagination"
      alignItems="center"
      justifyContent="flexEnd"
      data-test-subj="osdDocTablePagination"
    >
      {endItem >= sampleSize && (
        <EuiFlexItem grow={false}>
          <EuiTextColor color="subdued">
            <FormattedMessage
              id="discover.docTable.limitedSearchResultLabel"
              defaultMessage="Limited to {sampleSize} results. Refine your search."
              values={{ sampleSize }}
            />
          </EuiTextColor>
        </EuiFlexItem>
      )}
      <EuiFlexItem grow={false}>
        <FormattedMessage
          id="discover.docTable.pagerControl.pagesCountLabel"
          defaultMessage="{startItem}&ndash;{endItem} of {totalItems}"
          values={{
            startItem,
            endItem,
            totalItems,
          }}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiPagination
          pageCount={pageCount}
          activePage={activePage}
          onPageClick={(currentPage) => goToPage(currentPage)}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
