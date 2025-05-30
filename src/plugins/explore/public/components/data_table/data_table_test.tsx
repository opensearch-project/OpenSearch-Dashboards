/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// /*
//  * Copyright OpenSearch Contributors
//  * SPDX-License-Identifier: Apache-2.0
//  */

// import './_doc_table.scss';

// import React, { useEffect, useMemo, useState, useCallback } from 'react';
// import { EuiSmallButtonEmpty, EuiCallOut, EuiProgress } from '@elastic/eui';
// import { FormattedMessage } from '@osd/i18n/react';
// import { IndexPattern } from 'src/plugins/data/public';
// import { TableHeader } from './table_header/table_header';
// import {
//   DocViewFilterFn,
//   DocViewsRegistry,
//   OpenSearchSearchHit,
// } from '../../types/doc_views_types';
// import { TableRow } from './table_row/table_row';
// import { LegacyDisplayedColumn } from '../../helpers/data_table_helper';
// import { SortOrder } from '../../types/saved_search_types';

// export interface DefaultDiscoverTableProps {
//   columns: LegacyDisplayedColumn[];
//   hits?: number;
//   rows: OpenSearchSearchHit[];
//   indexPattern: IndexPattern;
//   sort: SortOrder[];
//   sampleSize: number;
//   isShortDots: boolean;
//   docViewsRegistry: DocViewsRegistry;
//   onSort: (s: SortOrder[]) => void;
//   onRemoveColumn: (column: string) => void;
//   onMoveColumn: (colName: string, destination: number) => void;
//   onAddColumn: (column: string) => void;
//   onFilter: DocViewFilterFn;
//   onClose?: () => void;
//   scrollToTop?: () => void;
//   loadMore?: () => void;
// }

// // ToDo: These would need to be read from an upcoming config panel
// const PAGINATED_PAGE_SIZE = 50;
// const INFINITE_SCROLLED_PAGE_SIZE = 10;
// // How far to queue unrendered rows ahead of time during infinite scrolling
// const DESIRED_ROWS_LOOKAHEAD = 5 * INFINITE_SCROLLED_PAGE_SIZE;

// export const DataTable = ({
//   columns,
//   rows,
//   indexPattern,
//   sort,
//   sampleSize,
//   isShortDots,
//   docViewsRegistry,
//   onSort,
//   onRemoveColumn,
//   onMoveColumn,
//   onAddColumn,
//   onFilter,
//   onClose,
//   scrollToTop,
//   loadMore,
// }: DefaultDiscoverTableProps) => {
//   const columnsName = useMemo(() => {
//     return columns.map((column) => column.name);
//   }, [columns]);
//   /* INFINITE_SCROLLED_PAGE_SIZE:
//    * Infinitely scrolling, a page of 10 rows is shown and then 4 pages are lazy-loaded for a total of 5 pages.
//    *   * The lazy-loading is mindful of the performance by monitoring the fps of the browser.
//    *   *`renderedRowCount` and `desiredRowCount` are only used in this method.
//    *
//    * PAGINATED_PAGE_SIZE
//    * Paginated, the view is broken into pages of 50 rows.
//    *   * `displayedRows` and `currentRowCounts` are only used in this method.
//    */
//   const [renderedRowCount, setRenderedRowCount] = useState(INFINITE_SCROLLED_PAGE_SIZE);

//   // `sentinelElement` is attached to the bottom of the table to observe when the table is scrolled all the way.
//   const [sentinelElement, setSentinelElement] = useState<HTMLDivElement>();
//   // Need callback refs since the elements aren't set on the first render.
//   const sentinelRef = useCallback((node: HTMLDivElement | null) => {
//     if (node !== null) {
//       setSentinelElement(node);
//     }
//   }, []);

//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       (entries) => {
//         if (entries[0].isIntersecting && loadMore) {
//           loadMore();
//         }
//       },
//       // Important that 0 < threshold < 1, since there OSD application div has a transparent
//       // fade at the bottom which causes the sentinel element to sometimes not be 100% visible
//       { threshold: 0.1 }
//     );

//     if (sentinelElement) {
//       observer.observe(sentinelElement);
//     }

//     return () => {
//       if (sentinelElement) {
//         observer.unobserve(sentinelElement);
//       }
//     };
//   }, [loadMore, sentinelElement]);

//   return (
//     indexPattern && (
//       <>
//         <table data-test-subj="docTable" className="explore-table table">
//           <thead>
//             <TableHeader
//               displayedColumns={columns}
//               onChangeSortOrder={onSort}
//               onMoveColumn={onMoveColumn}
//               onRemoveColumn={onRemoveColumn}
//               sortOrder={sort}
//             />
//           </thead>
//           <tbody>
//             {rows.map((row: OpenSearchSearchHit, index: number) => {
//               return (
//                 <TableRow
//                   key={row._id}
//                   row={row}
//                   columns={columnsName}
//                   indexPattern={indexPattern}
//                   onRemoveColumn={onRemoveColumn}
//                   onAddColumn={onAddColumn}
//                   onFilter={onFilter}
//                   onClose={onClose}
//                   isShortDots={isShortDots}
//                   docViewsRegistry={docViewsRegistry}
//                 />
//               );
//             })}
//           </tbody>
//         </table>

//         <div ref={sentinelRef}>
//           {renderedRowCount < rows.length && (
//             <EuiProgress
//               size="xs"
//               color="accent"
//               data-test-subj="discoverRenderedRowsProgress"
//               style={{
//                 // Add a little margin if we aren't rendering the truncation callout below, to make
//                 // the progress bar render better when it's not present
//                 marginBottom: rows.length !== sampleSize ? '5px' : '0',
//               }}
//             />
//           )}
//         </div>
//         {rows.length === sampleSize && (
//           <EuiCallOut className="exploreTable__footer" data-test-subj="discoverDocTableFooter">
//             <FormattedMessage
//               id="discover.howToSeeOtherMatchingDocumentsDescription"
//               defaultMessage="These are the first {sampleSize} documents matching
//               your search, refine your search to see others."
//               values={{ sampleSize }}
//             />

//             <EuiSmallButtonEmpty onClick={scrollToTop}>
//               <FormattedMessage id="discover.backToTopLinkText" defaultMessage="Back to top." />
//             </EuiSmallButtonEmpty>
//           </EuiCallOut>
//         )}
//       </>
//     )
//   );
// };
