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
  EuiTitle,
} from '@elastic/eui';
import { DocViewer } from '../doc_viewer/doc_viewer';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { DocViewFilterFn } from '../../doc_views/doc_views_types';
import { DocViewerLinks } from '../doc_viewer_links/doc_viewer_links';

interface Props {
  columns: string[];
  hit: any;
  indexPattern: IndexPattern;
  onAddColumn: (column: string) => void;
  onClose: () => void;
  onFilter: DocViewFilterFn;
  onRemoveColumn: (column: string) => void;
  setDetailFlyoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSurroundingFlyoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function DataGridFlyout({
  hit,
  columns,
  indexPattern,
  onAddColumn,
  onClose,
  onFilter,
  onRemoveColumn,
  setDetailFlyoutOpen,
  setSurroundingFlyoutOpen,
}: Props) {
  // TODO: replace EuiLink with doc_view_links registry
  // TODO: Also move the flyout higher in the react tree to prevent redrawing the table component and slowing down page performance
  const openSurroundingFlyout = () => {
    setSurroundingFlyoutOpen(true);
    setDetailFlyoutOpen(false);
  };

  return (
    <EuiFlyout onClose={onClose} size="m">
      <EuiFlyoutHeader>
        <EuiTitle>
          <h2>Document Details</h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiFlexGroup direction="column">
          <EuiFlexItem>
            <DocViewerLinks hit={hit} indexPattern={indexPattern} columns={columns} onClick={openSurroundingFlyout} />
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
