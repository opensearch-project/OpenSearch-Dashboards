/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiIcon,
  EuiLink,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSelectable,
  EuiText,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { BaseDataset, DATA_STRUCTURE_META_TYPES, DataStructure } from '../../../common';
import { QueryStringContract } from '../../query';
import { IDataPluginServices } from '../../types';

export const DatasetExplorer = ({
  services,
  queryString,
  path,
  setPath,
  onNext,
  onCancel,
}: {
  services: IDataPluginServices;
  queryString: QueryStringContract;
  path: DataStructure[];
  setPath: (path: DataStructure[]) => void;
  onNext: (dataset: BaseDataset) => void;
  onCancel: () => void;
}) => {
  const [explorerDataset, setExplorerDataset] = useState<BaseDataset | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  const selectDataStructure = async (item: DataStructure, newPath: DataStructure[]) => {
    const lastPathItem = newPath[newPath.length - 1];
    const nextPath = [...newPath, item];

    const typeConfig = queryString.getDatasetService().getType(nextPath[1].id);
    if (!typeConfig) return;

    if (!lastPathItem.hasNext) {
      const dataset = typeConfig!.toDataset(nextPath);
      setExplorerDataset(dataset as BaseDataset);
      return;
    }

    setLoading(true);
    const nextDataStructure = await queryString
      .getDatasetService()
      .fetchOptions(services, nextPath, typeConfig.id);
    setLoading(false);

    setPath([...newPath, nextDataStructure]);
  };

  const columnCount = path[path.length - 1]?.hasNext ? path.length + 1 : path.length;

  return (
    <>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h1>
            <FormattedMessage
              id="data.explorer.datasetSelector.advancedSelector.title.step1"
              defaultMessage="Step 1: Select data"
            />
          </h1>
          <EuiText>
            <p>
              <FormattedMessage
                id="data.explorer.datasetSelector.advancedSelector.description"
                defaultMessage="Select from those available to you. "
              />
              <EuiLink
                href={`${services.http.basePath.get()}/app/management/opensearch-dashboards/dataSources`}
                target="_blank"
              >
                <FormattedMessage
                  id="data.explorer.datasetSelector.advancedSelector.dataSourceManagement.title"
                  defaultMessage="Manage data sources"
                />
              </EuiLink>
            </p>
          </EuiText>
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        <div
          className="datasetExplorer"
          style={{
            gridTemplateColumns: `repeat(${
              columnCount - 1
            }, minmax(200px, 240px)) minmax(300px, 1fr)`,
          }}
        >
          {path.map((current, index) => {
            const isLast = index === path.length - 1;
            const isFinal = isLast && !current.hasNext;
            return (
              <div
                key={current.id}
                className={`datasetExplorer__column ${
                  isFinal ? ' datasetExplorer__column--leaf' : ''
                }`}
              >
                <EuiTitle size="xxs" className="datasetExplorer__columnTitle">
                  <h3>{current.columnHeader}</h3>
                </EuiTitle>
                <EuiSelectable
                  options={(current.children || []).map((child) => ({
                    label: child.parent ? `${child.parent.title}::${child.title}` : child.title,
                    value: child.id,
                    prepend: child.meta?.type === DATA_STRUCTURE_META_TYPES.TYPE &&
                      child.meta?.icon && <EuiIcon {...child.meta.icon} />,
                    append: appendIcon(child),
                    checked: isChecked(child, index, path, explorerDataset),
                  }))}
                  onChange={(options) => {
                    const selected = options.find((option) => option.checked);
                    if (selected) {
                      const item = current.children?.find((child) => child.id === selected.value);
                      if (item) {
                        selectDataStructure(item, path.slice(0, index + 1));
                      }
                    }
                  }}
                  singleSelection
                  {...(isFinal && {
                    searchProps: {
                      compressed: true,
                    },
                    searchable: true,
                  })}
                  height="full"
                  className="datasetExplorer__selectable"
                >
                  {(list, search) => (
                    <>
                      {isFinal && search}
                      {list}
                    </>
                  )}
                </EuiSelectable>
              </div>
            );
          })}
          {!!path[path.length - 1]?.hasNext && <LoadingEmptyColumn isLoading={loading} />}
        </div>
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButtonEmpty onClick={onCancel}>
          <FormattedMessage
            id="data.explorer.datasetSelector.advancedSelector.cancel"
            defaultMessage="Cancel"
          />
        </EuiButtonEmpty>
        <EuiButton
          disabled={explorerDataset === undefined}
          onClick={() => onNext(explorerDataset!)}
          iconType="arrowRight"
          iconSide="right"
          fill
        >
          <FormattedMessage
            id="data.explorer.datasetSelector.advancedSelector.next"
            defaultMessage="Next"
          />
        </EuiButton>
      </EuiModalFooter>
    </>
  );
};

const EmptyColumn = () => (
  <div className="datasetExplorer__column datasetExplorer__column--empty" />
);

const LoadingEmptyColumn = ({ isLoading }: { isLoading: boolean }) =>
  isLoading ? (
    <div className="datasetExplorer__column">
      <EuiTitle size="xxs" className="datasetExplorer__columnTitle">
        <h3>...</h3>
      </EuiTitle>
      <EuiSelectable options={[]} singleSelection className="datasetExplorer__selectable" isLoading>
        {(list) => <>{list}</>}
      </EuiSelectable>
    </div>
  ) : (
    <EmptyColumn />
  );
const appendIcon = (item: DataStructure) => {
  if (item.meta?.type === DATA_STRUCTURE_META_TYPES.TYPE) {
    return (
      <EuiToolTip content={item.meta.tooltip}>
        <EuiIcon type="iInCircle" />
      </EuiToolTip>
    );
  } else {
    if (item.meta?.icon && item.meta?.tooltip) {
      return (
        <EuiToolTip content={item.meta.tooltip}>
          <EuiIcon {...item.meta.icon} />
        </EuiToolTip>
      );
    } else if (item.meta?.icon) {
      return <EuiIcon {...item.meta.icon} />;
    }
  }

  return null;
};

const isChecked = (
  child: DataStructure,
  index: number,
  path: DataStructure[],
  explorerDataset?: BaseDataset
) => {
  if (index === path.length - 1) {
    // For the last level, check against the selectedDataSet
    return child.id === explorerDataset?.id ? 'on' : undefined;
  }
  // For other levels, check against the next item in the path
  return child.id === path[index + 1]?.id ? 'on' : undefined;
};
