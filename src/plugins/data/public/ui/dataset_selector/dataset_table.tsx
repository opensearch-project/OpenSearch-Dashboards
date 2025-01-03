/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBasicTable, EuiFieldSearch, EuiLink, EuiText } from '@elastic/eui';
import React, { useRef, useState } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { DataStructure } from '../../../common';
import { getQueryService } from '../../services';
import { DatasetTypeConfig, DataStructureFetchOptions } from '../../query';
import { IDataPluginServices } from '../..';

interface DatasetTableProps {
  services: IDataPluginServices;
  path: DataStructure[];
  setPath: (newPath: DataStructure[]) => void;
  index: number;
  explorerDataset: DataStructure | undefined;
  selectDataStructure: (item: DataStructure | undefined, newPath: DataStructure[]) => Promise<void>;
  fetchNextDataStructure: (
    nextPath: DataStructure[],
    dataType: string,
    options?: DataStructureFetchOptions
  ) => Promise<DataStructure>;
}

export const DatasetTable: React.FC<DatasetTableProps> = (props) => {
  const datasetService = getQueryService().queryString.getDatasetService();
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const dataStructures = props.path[props.index].children || [];
  const paginationToken = props.path[props.index].paginationToken;

  const onTableChange = async (options: DataStructureFetchOptions) => {
    const typeConfig = datasetService.getType(props.path[1].id);
    if (!typeConfig) return;

    setLoading(true);
    await props
      .fetchNextDataStructure(props.path, typeConfig.id, options)
      .then((newDataStructure) => {
        props.setPath([...props.path.slice(0, props.index), newDataStructure]);
      })
      .finally(() => setLoading(false));
  };

  const onSelectionChange = (items: DataStructure[]) => {
    if (items.length === 0) {
      props.selectDataStructure(undefined, props.path.slice(0, props.index + 1));
      return;
    }
    if (!items.every((item) => item.type === items[0].type)) {
      props.services.notifications.toasts.addWarning(
        i18n.translate(
          'data.explorer.datasetSelector.advancedSelector.datasetTable.multipleItemTypeMessage',
          {
            defaultMessage: 'All selected datasets must be of the same type.',
          }
        )
      );
      return;
    }
    const typeConfig = datasetService.getType(props.path[1].id);
    const combineDataStructures: NonNullable<DatasetTypeConfig['combineDataStructures']> =
      typeConfig?.combineDataStructures ??
      ((ds) => ({
        id: ds.map((item) => item.id).join(','),
        title: ds.map((item) => item.title).join(','),
        type: ds[0].type,
      }));

    props.selectDataStructure(combineDataStructures(items), props.path.slice(0, props.index + 1));
  };

  return (
    <div className="datasetTable" data-test-subj="datasetTable">
      <EuiFieldSearch
        fullWidth
        inputRef={(node) => (searchRef.current = node)}
        onSearch={(value) => onTableChange({ search: value })}
      />

      <EuiBasicTable
        items={dataStructures}
        itemId="id"
        columns={[{ field: 'title', name: 'Name' }]}
        loading={loading}
        isSelectable
        selection={{ onSelectionChange }}
      />

      {paginationToken && (
        <div className="datasetTable__loadMore" data-test-subj="datasetTableLoadMore">
          <EuiLink
            onClick={() => onTableChange({ paginationToken, search: searchRef.current?.value })}
          >
            <EuiText size="s">
              <FormattedMessage
                id="data.explorer.datasetSelector.advancedSelector.loadMore"
                defaultMessage="Load more"
              />
            </EuiText>
          </EuiLink>
        </div>
      )}
    </div>
  );
};
