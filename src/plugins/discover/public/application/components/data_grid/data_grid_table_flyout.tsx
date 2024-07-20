/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { DocViewer } from '../doc_viewer/doc_viewer';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { DocViewerLinks } from '../doc_viewer_links/doc_viewer_links';

interface Props {
  columns: string[];
  hit: OpenSearchSearchHit;
  indexPattern: IndexPattern;
  onAddColumn: (column: string) => void;
  onClose: () => void;
  onFilter: DocViewFilterFn;
  onRemoveColumn: (column: string) => void;
}

export function DataGridFlyout({
  hit,
  columns,
  indexPattern,
  onAddColumn,
  onClose,
  onFilter,
  onRemoveColumn,
}: Props) {
  // TODO: replace EuiLink with doc_view_links registry
  // TODO: Also move the flyout higher in the react tree to prevent redrawing the table component and slowing down page performance
  return (
    <EuiFlyout onClose={onClose} size="m" data-test-subj="documentDetailFlyOut" ownFocus={false}>
      <EuiFlyoutHeader>
        <EuiText size="s">
          <h2>
            <FormattedMessage id="discover.docView.flyoutTitle" defaultMessage="Document Details" />
          </h2>
        </EuiText>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiFlexGroup direction="column">
          <EuiFlexItem>
            <EuiText size="s">
              <DocViewerLinks hit={hit} indexPattern={indexPattern} columns={columns} />
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
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
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutBody>
    </EuiFlyout>
  );
}
