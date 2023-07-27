/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { stringify } from 'query-string';
import rison from 'rison-node';

import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiLink,
  EuiSpacer,
} from '@elastic/eui';
import { DocViewer } from '../doc_viewer/doc_viewer';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { DocViewFilterFn } from '../../doc_views/doc_views_types';
import { DiscoverServices } from '../../../build_services';
import { url } from '../../../../../opensearch_dashboards_utils/common';
import { opensearchFilters } from '../../../../../data/public';

interface Props {
  columns: string[];
  hit: any;
  indexPattern: IndexPattern;
  onAddColumn: (column: string) => void;
  onClose: () => void;
  onFilter: DocViewFilterFn;
  onRemoveColumn: (column: string) => void;
  services: DiscoverServices;
}

export function DataGridFlyout({
  hit,
  columns,
  indexPattern,
  onAddColumn,
  onClose,
  onFilter,
  onRemoveColumn,
  services,
}: Props) {
  const generateSurroundingDocumentsUrl = (hitId: string, indexPatternId: string) => {
    const globalFilters = services.filterManager.getGlobalFilters();
    const appFilters = services.filterManager.getAppFilters();

    const hash = stringify(
      url.encodeQuery({
        _g: rison.encode({
          filters: globalFilters || [],
        }),
        _a: rison.encode({
          columns,
          filters: (appFilters || []).map(opensearchFilters.disableFilter),
        }),
      }),
      { encode: false, sort: false }
    );

    return `#/context/${encodeURIComponent(indexPatternId)}/${encodeURIComponent(hitId)}?${hash}`;
  };

  const generateSingleDocumentUrl = (hitObj: any, indexPatternId: string) => {
    return `#/doc/${indexPatternId}/${hitObj._index}?id=${encodeURIComponent(hit._id)}`;
  };

  // TODO: replace EuiLink with doc_view_links registry
  return (
    <EuiFlyout onClose={onClose} size="m">
      <EuiFlyoutHeader>
        <EuiTitle>
          <h2>Document Details</h2>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiLink href={generateSingleDocumentUrl(hit, indexPattern.id)}>
              {i18n.translate('discover.docTable.tableRow.viewSingleDocumentLinkText', {
                defaultMessage: 'View single document',
              })}
            </EuiLink>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiLink href={generateSurroundingDocumentsUrl(hit._id, indexPattern.id)}>
              {i18n.translate('discover.docTable.tableRow.viewSurroundingDocumentsLinkText', {
                defaultMessage: 'View surrounding documents',
              })}
            </EuiLink>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiFlexGroup direction="column">
          <DocViewer
            hit={hit}
            columns={columns}
            indexPattern={indexPattern}
            onRemoveColumn={(columnName: string) => {
              onRemoveColumn(columnName);
              onClose();
            }}
            onAddColumn={(columnName: string) => {
              onAddColumn(columnName);
              onClose();
            }}
            filter={(mapping, value, mode) => {
              onFilter(mapping, value, mode);
              onClose();
            }}
          />
        </EuiFlexGroup>
      </EuiFlyoutBody>
    </EuiFlyout>
  );
}
