/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { DATA_STRUCTURE_META_TYPES, Dataset, DataStructure, DEFAULT_DATA } from '../../../common';
import { DatasetContract } from '../../query';

export const DatasetExplorer = ({
  savedObjects,
  datasetManager,
  onNext,
  onCancel,
}: {
  savedObjects: SavedObjectsClientContract;
  datasetManager: DatasetContract;
  onNext: (dataStructure: DataStructure) => void;
  onCancel: () => void;
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [currentDataStructure, setCurrentDataStructure] = useState<DataStructure>(
    DEFAULT_DATA.STRUCTURES.ROOT
  );
  const [dataStructures, setDataStructures] = useState<DataStructure[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      if (!datasetManager.isLeafDataStructure(currentDataStructure)) {
        setLoading(true);
        try {
          const children = await datasetManager.fetchOptions(savedObjects, currentDataStructure);
          setCurrentDataStructure({ ...currentDataStructure, children });
        } finally {
          setLoading(false);
        }
      }
    };

    loadCategories();
  }, [currentDataStructure, datasetManager, savedObjects]);

  const selectDataStructure = async (item: DataStructure) => {
    if (!datasetManager.isLeafDataStructure(item)) {
      setCurrentDataStructure(item);
      setDataStructures([...dataStructures, currentDataStructure]);
    }
  };

  const goBack = () => {
    if (dataStructures.length > 0) {
      const newStack = dataStructures.slice(0, -1);
      setDataStructures(newStack);
      const previousStructure = newStack[newStack.length - 1] || DEFAULT_DATA.STRUCTURES.ROOT;
      setCurrentDataStructure(previousStructure);
    }
  };

  const isLeaf = datasetManager.isLeafDataStructure(currentDataStructure);
  const columnCount = dataStructures.length + (isLeaf ? 1 : 2); // +1 for current, +1 for next (if not leaf)

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
              <EuiLink href="#" external>
                Manage data sources
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
          {dataStructures.map((structure, index) => (
            <DataStructureColumn
              key={structure.id}
              dataStructure={structure}
              onSelect={(item) => {
                setDataStructures(dataStructures.slice(0, index + 1));
                setCurrentDataStructure(item);
                selectDataStructure(item);
              }}
              isActive={false}
            />
          ))}
          <DataStructureColumn
            dataStructure={currentDataStructure}
            onSelect={selectDataStructure}
            isActive={true}
            isLoading={loading}
            isLeaf={isLeaf}
          />
          {!isLeaf && <EmptyColumn />}
        </div>
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButtonEmpty onClick={onCancel}>
          <FormattedMessage
            id="data.explorer.datasetSelector.advancedSelector.cancel"
            defaultMessage="Cancel"
          />
        </EuiButtonEmpty>
        <EuiButtonEmpty
          onClick={goBack}
          disabled={dataStructures.length === 0}
          iconType="arrowLeft"
        >
          Back
        </EuiButtonEmpty>
        <EuiButton
          disabled={!isLeaf}
          onClick={() => onNext(currentDataStructure)}
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

const DataStructureColumn = ({
  dataStructure,
  onSelect,
  isActive,
  isLoading = false,
  isLeaf = false,
}: {
  dataStructure: DataStructure;
  onSelect: (item: DataStructure) => void;
  isActive: boolean;
  isLoading?: boolean;
  isLeaf?: boolean;
}) => (
  <div className={`datasetExplorer__column ${isActive ? 'datasetExplorer__column--active' : ''}`}>
    <EuiTitle size="xxs" className="datasetExplorer__columnTitle">
      <h3>{dataStructure.title}</h3>
    </EuiTitle>
    <EuiSelectable
      options={(dataStructure.children || []).map((child) => ({
        label: child.title,
        value: child.id,
        prepend: child.meta?.type === DATA_STRUCTURE_META_TYPES.TYPE && child.meta?.icon && (
          <EuiIcon {...child.meta.icon} />
        ),
        append: appendIcon(child),
        disabled: isLeaf,
      }))}
      onChange={(options) => {
        if (!isLeaf) {
          const selected = options.find((option) => option.checked);
          if (selected) {
            const item = dataStructure.children?.find((child) => child.id === selected.value);
            if (item) {
              onSelect(item);
            }
          }
        }
      }}
      singleSelection
      searchable={isActive}
      isLoading={isLoading}
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

const EmptyColumn = () => (
  <div className="datasetExplorer__column datasetExplorer__column--empty" />
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
