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
import {
  DATA_STRUCTURE_META_TYPES,
  Dataset,
  DatasetPathItem,
  DataStructure,
} from '../../../common';
import { mockDatasetManager } from './__mocks__/utils';

export const DatasetExplorer = ({
  onNext,
  setPath,
  path,
  onCancel,
}: {
  onNext: (dataset: Dataset) => void;
  setPath: (path: DatasetPathItem[]) => void;
  path: DatasetPathItem[];
  onCancel: () => void;
}) => {
  const [selectedDataSet, setSelectedDataSetState] = useState<Dataset | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  const selectDatasetPathItem = async (item: DataStructure, newPath: DatasetPathItem[]) => {
    const lastPathItem = newPath[newPath.length - 1];
    const nextPath = [...newPath, item];

    if (!lastPathItem.isLoadable) {
      const dataset = await mockDatasetManager.getType(nextPath[1].id).getDataset(nextPath);
      setSelectedDataSetState(dataset);
      return;
    }

    setLoading(true);
    const { isLoadable = false, options, columnHeader } = await mockDatasetManager
      .getType(nextPath[1].id)
      .getOptions(nextPath);
    setLoading(false);

    setPath([
      ...newPath,
      {
        ...item,
        children: options,
        isLoadable,
        columnHeader,
      },
    ]);
  };

  const columnCount = path[path.length - 1].isLoadable ? path.length + 1 : path.length;

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
                defaultMessage="Select the from those available to you. "
              />
              <EuiLink href="#" external>
                Manage datasources
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
          {/* Render each level of the dataset path */}
          {path.map((current, index) => {
            const isLast = index === path.length - 1; // Check if this is the last item in the path
            const isFinal = isLast && !current.isLoadable; // Check if the next item in the path is loadable
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
                  options={current.children?.map((child) => ({
                    label: child.title,
                    value: child.id,
                    prepend: child.meta?.type === DATA_STRUCTURE_META_TYPES.TYPE &&
                      child.meta?.icon && <EuiIcon {...child.meta.icon} />, // Prepend icon is only for types
                    append: appendIcon(child),
                    checked: isChecked(child, index, path, selectedDataSet),
                  }))}
                  onChange={(options) => {
                    const selected = options.find((option) => option.checked);
                    if (selected) {
                      const item = current.children?.find((child) => child.id === selected.value);
                      if (item) {
                        selectDatasetPathItem(item, path.slice(0, index + 1));
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
                  className="datasetSelector__selectable"
                >
                  {(list, search) => (
                    <>
                      {search}
                      {list}
                    </>
                  )}
                </EuiSelectable>
              </div>
            );
          })}
          {path[path.length - 1].isLoadable && <LoadingEmptyColumn isLoading={loading} />}
        </div>
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButtonEmpty onClick={() => onCancel()}>
          <FormattedMessage
            id="data.explorer.datasetSelector.advancedSelector.cancel"
            defaultMessage="Cancel"
          />
        </EuiButtonEmpty>
        <EuiButton
          disabled={selectedDataSet === undefined}
          onClick={() => onNext(selectedDataSet!)} // Button is only enabled if a dataset is selected
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
      <EuiSelectable options={[]} singleSelection className="datasetSelector__selectable" isLoading>
        {(list) => <>{list}</>}
      </EuiSelectable>
    </div>
  ) : (
    <EmptyColumn />
  );

const appendIcon = (item: DataStructure) => {
  if (item.meta?.type === DATA_STRUCTURE_META_TYPES.FEATURE) {
    if (item.meta?.icon && item.meta?.tooltip) {
      return (
        <EuiToolTip content={item.meta.tooltip}>
          <EuiIcon type={item.meta.icon} />
        </EuiToolTip>
      );
    } else if (item.meta?.icon) {
      return <EuiIcon type={item.meta.icon} />;
    }
  }

  if (item.meta?.type === DATA_STRUCTURE_META_TYPES.TYPE) {
    return (
      <EuiToolTip content={item.meta.tooltip}>
        <EuiIcon type="iInCircle" />
      </EuiToolTip>
    );
  }

  return null;
};

const isChecked = (
  child: DataStructure,
  index: number,
  path: DatasetPathItem[],
  selectedDataSet?: Dataset
) => {
  if (index === path.length - 1) {
    // For the last level, check against the selectedDataSet
    return child.id === selectedDataSet?.id ? 'on' : undefined;
  }
  // For other levels, check against the next item in the path
  return child.id === path[index + 1]?.id ? 'on' : undefined;
};
