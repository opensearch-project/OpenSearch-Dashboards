/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { i18n } from '@osd/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiIcon } from '@elastic/eui';
import React, { useMemo } from 'react';
import { IndexPattern, DataView as Dataset } from 'src/plugins/data/public';
import {
  DocViewFilterFn,
  DocViewsRegistry,
  OpenSearchSearchHit,
} from '../../../../types/doc_views_types';
import { DocViewer } from '../../../doc_viewer/doc_viewer';
import { useFlavorId } from '../../../../helpers/use_flavor_id';
import { ExploreFlavor } from '../../../../../common';

export interface ExpandedTableRowProps {
  row: OpenSearchSearchHit<Record<string, unknown>>;
  columns: string[];
  dataset: IndexPattern | Dataset;
  onRemoveColumn?: (column: string) => void;
  onAddColumn?: (column: string) => void;
  onFilter?: DocViewFilterFn;
  onClose?: () => void;
  docViewsRegistry: DocViewsRegistry;
}

export const ExpandedTableRow: React.FC<ExpandedTableRowProps> = ({
  row,
  columns,
  dataset,
  onFilter,
  onRemoveColumn,
  onAddColumn,
  onClose,
  docViewsRegistry,
}) => {
  const flavorId = useFlavorId();
  const headerText = useMemo(() => {
    if (flavorId === ExploreFlavor.Traces) {
      return i18n.translate('explore.dataTable.expandedRow.spanHeading', {
        defaultMessage: 'Expanded span',
      });
    }
    return i18n.translate('explore.dataTable.expandedRow.documentHeading', {
      defaultMessage: 'Expanded document',
    });
  }, [flavorId]);

  return (
    <tr key={'x' + row._id}>
      <td
        className="exploreDocTable__detailsParent"
        colSpan={columns.length + 1}
        data-test-subj="osdDocTableDetailsParent"
      >
        <EuiFlexGroup gutterSize="m" alignItems="center">
          <EuiFlexItem
            grow={false}
            className="exploreDocTable__detailsIconContainer"
            data-test-subj="osdDocTableDetailsIconContainer"
          >
            <EuiIcon type="folderOpen" />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <h4 className="euiTitle euiTitle--xxsmall">{headerText}</h4>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup gutterSize="m">
          <EuiFlexItem>
            <DocViewer
              renderProps={{
                hit: row,
                columns,
                indexPattern: dataset,
                filter: onFilter
                  ? (mapping, value, mode) => {
                      onFilter(mapping, value, mode);
                      onClose?.();
                    }
                  : undefined,
                onAddColumn: onAddColumn
                  ? (columnName: string) => {
                      onAddColumn(columnName);
                      onClose?.();
                    }
                  : undefined,
                onRemoveColumn: onRemoveColumn
                  ? (columnName: string) => {
                      onRemoveColumn(columnName);
                      onClose?.();
                    }
                  : undefined,
              }}
              docViewsRegistry={docViewsRegistry}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </td>
    </tr>
  );
};
