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
  onNext: (dataset: Dataset) => void;
  onCancel: () => void;
}) => {
  const [selectedDataSet, setSelectedDataSet] = useState<Dataset | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentDataStructure, setCurrentDataStructure] = useState<DataStructure>(
    DEFAULT_DATA.STRUCTURES.ROOT
  );
  const [dataStructures, setDataStructures] = useState<DataStructure[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        currentDataStructure.children = await datasetManager.fetchOptions(
          savedObjects,
          currentDataStructure
        );
        setCurrentDataStructure(currentDataStructure);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [currentDataStructure, datasetManager, savedObjects]);

  const selectDataStructure = async (item: DataStructure) => {
    setLoading(true);
    try {
      const children = await datasetManager.fetchOptions(savedObjects, item);
      if (datasetManager.isLeafDataStructure(item)) {
        // If it's a leaf, we don't set the dataset immediately
        // Instead, we update the current structure to show the leaf as selectable
        setCurrentDataStructure({ ...item, children });
        setDataStructures([...dataStructures, item]);

        // Enable the next button if this is a selectable leaf
        const dataset = datasetManager.toDataset(item);
        setSelectedDataSet(dataset);
      } else {
        // If it's not a leaf, we continue navigation as before
        setCurrentDataStructure({ ...item, children });
        setDataStructures([...dataStructures, item]);
        // Clear any previously selected dataset as we're not at a leaf anymore
        setSelectedDataSet(undefined);
      }
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (dataStructures.length > 0) {
      const newStack = dataStructures.slice(0, -1);
      setDataStructures(newStack);
      const previousStructure = newStack[newStack.length - 1] || {
        ...DEFAULT_DATA.STRUCTURES.ROOT,
        children: [],
      };
      setCurrentDataStructure(previousStructure);
      setSelectedDataSet(undefined);
    }
  };

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
        <div className="datasetExplorer">
          <EuiTitle size="xxs" className="datasetExplorer__columnTitle">
            <h3>{currentDataStructure?.title || 'Data Sources'}</h3>
          </EuiTitle>
          <EuiSelectable
            options={(currentDataStructure?.children || []).map((child) => ({
              label: child.title,
              value: child.id,
              prepend: child.meta?.type === DATA_STRUCTURE_META_TYPES.TYPE && child.meta?.icon && (
                <EuiIcon {...child.meta.icon} />
              ),
              append: appendIcon(child),
            }))}
            onChange={(options) => {
              const selected = options.find((option) => option.checked);
              if (selected) {
                const item = currentDataStructure?.children?.find(
                  (child) => child.id === selected.value
                );
                if (item) {
                  selectDataStructure(item);
                }
              }
            }}
            singleSelection
            searchable={true}
            isLoading={loading}
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
          disabled={selectedDataSet === undefined}
          onClick={() => onNext(selectedDataSet!)}
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
