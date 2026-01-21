/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiIconTip,
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
import moment from 'moment';
import {
  BaseDataset,
  DATA_STRUCTURE_META_TYPES,
  DataStructure,
  DataStructureCustomMeta,
} from '../../../common';
import { DataStructureFetchOptions, QueryStringContract } from '../../query';
import { IDataPluginServices } from '../../types';
import { DatasetTable } from './dataset_table';

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
  const uiSettings = services.uiSettings;
  const [explorerDataset, setExplorerDataset] = useState<BaseDataset | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [autoSelectionDone, setAutoSelectionDone] = useState<Set<number>>(new Set());
  const datasetService = queryString.getDatasetService();

  const fetchNextDataStructure = React.useCallback(
    async (nextPath: DataStructure[], dataType: string, options?: DataStructureFetchOptions) =>
      datasetService.fetchOptions(services, nextPath, dataType, options),
    [datasetService, services]
  );

  const selectDataStructure = React.useCallback(
    async (item: DataStructure | undefined, newPath: DataStructure[]) => {
      if (!item) {
        setExplorerDataset(undefined);
        return;
      }
      const lastPathItem = newPath[newPath.length - 1];
      const nextPath = [...newPath, item];

      const typeConfig = datasetService.getType(nextPath[1].id);
      if (!typeConfig) return;

      if (!lastPathItem.hasNext) {
        const dataset = typeConfig!.toDataset(nextPath);
        setExplorerDataset(dataset as BaseDataset);
        return;
      }

      setLoading(true);
      const nextDataStructure = await fetchNextDataStructure(nextPath, typeConfig.id);
      setLoading(false);

      setPath([...newPath, nextDataStructure]);
    },
    [datasetService, fetchNextDataStructure, setPath]
  );

  // Auto-select if there's only one option at the current level, or if at data source level
  React.useEffect(() => {
    const currentIndex = path.length - 1;
    const current = path[currentIndex];

    // Skip if we've already auto-selected at this level
    if (autoSelectionDone.has(currentIndex)) {
      return;
    }

    // Skip if loading or if there are no children
    if (loading || !current.children || current.children.length === 0) {
      return;
    }

    // Check if we're at the data source level (children have type DATA_SOURCE)
    const isDataSourceLevel = current.children.some((child) => child.type === 'DATA_SOURCE');

    // Auto-select if there's exactly one child, OR if we're at data source level (always select first)
    if (current.children.length === 1 || isDataSourceLevel) {
      const firstChild = current.children[0];
      // Mark this level as auto-selected
      setAutoSelectionDone((prev) => new Set([...prev, currentIndex]));
      // Automatically select it
      selectDataStructure(firstChild, path.slice(0, currentIndex + 1));
    }
  }, [path, loading, autoSelectionDone, selectDataStructure]);

  // Skip first column if it only has one child (auto-selected)
  const shouldSkipFirstColumn = path.length > 0 && path[0].children?.length === 1;
  const visiblePath = shouldSkipFirstColumn ? path.slice(1) : path;
  const columnCount =
    visiblePath.length > 0 && visiblePath[visiblePath.length - 1]?.hasNext
      ? visiblePath.length + 1
      : visiblePath.length;

  return (
    <>
      <EuiModalHeader>
        <EuiFlexGroup alignItems="center" justifyContent="flexEnd" gutterSize="s">
          <EuiFlexItem grow={true}>
            <EuiModalHeaderTitle>
              <h1>
                <FormattedMessage
                  id="data.explorer.datasetSelector.advancedSelector.title.step1"
                  defaultMessage="Step 1: Select data source"
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
          </EuiFlexItem>
          {queryString.getDatasetService().getLastCacheTime() && (
            <EuiFlexItem grow={false}>
              <EuiFlexGroup gutterSize="xs">
                <EuiFlexItem grow={false}>
                  <EuiText size="s">
                    <FormattedMessage
                      id="data.explorer.datasetSelector.advancedSelector.lastUpdatedTime"
                      defaultMessage="Last updated at: {timestamp}."
                      values={{
                        timestamp: moment(queryString.getDatasetService().getLastCacheTime())
                          .format(uiSettings.get('dateFormat'))
                          .toString(),
                      }}
                    />{' '}
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty
                    onClick={() => {
                      queryString.getDatasetService().clearCache();
                      onCancel();
                    }}
                    size="xs"
                    iconSide="left"
                    iconType="refresh"
                    iconGap="s"
                    flush="both"
                  >
                    <FormattedMessage
                      id="data.explorer.datasetSelector.advancedSelector.refreshCacheButton"
                      defaultMessage="Refresh Cache"
                    />
                  </EuiButtonEmpty>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiModalHeader>
      <EuiModalBody>
        <div
          className="datasetExplorer"
          data-test-subj="datasetExplorerWindow"
          style={{
            gridTemplateColumns: `repeat(${
              columnCount - 1
            }, minmax(200px, 240px)) minmax(300px, 1fr)`,
          }}
        >
          {visiblePath.map((current, visibleIndex) => {
            // Calculate the actual index in the full path
            const index = shouldSkipFirstColumn ? visibleIndex + 1 : visibleIndex;
            const isLast = index === path.length - 1;
            const isFinal = isLast && !current.hasNext;
            return (
              <div
                key={current.id}
                className={`datasetExplorer__column ${
                  isFinal ? ' datasetExplorer__column--leaf' : ''
                }`}
              >
                <EuiTitle
                  size="xxs"
                  className="datasetExplorer__columnTitle"
                  data-test-subj="datasetExplorerColumnTitle"
                >
                  <h3>{current.columnHeader}</h3>
                </EuiTitle>
                {current.DataStructureCreator ? (
                  <current.DataStructureCreator
                    path={path}
                    setPath={setPath}
                    index={index}
                    selectDataStructure={selectDataStructure}
                    services={services}
                    // @ts-ignore custom component can have their own fetch options
                    fetchDataStructure={fetchNextDataStructure}
                  />
                ) : current.multiSelect ? (
                  <DatasetTable
                    services={services}
                    path={path}
                    setPath={setPath}
                    index={index}
                    selectDataStructure={selectDataStructure}
                    fetchDataStructure={fetchNextDataStructure}
                  />
                ) : (
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
                    emptyMessage={
                      !current.children || current.children.length === 0 ? (
                        <EuiText size="s" color="subdued">
                          <p>
                            <FormattedMessage
                              id="data.explorer.datasetSelector.advancedSelector.noDataSources"
                              defaultMessage="No data source associated. "
                            />
                            <FormattedMessage
                              id="data.explorer.datasetSelector.advancedSelector.noDataSourcesAction"
                              defaultMessage="Please associate one using the"
                            />
                            <br />
                            <EuiLink
                              href={`${services.http.basePath.get()}/app/dataSources`}
                              target="_blank"
                              external
                            >
                              <FormattedMessage
                                id="data.explorer.datasetSelector.advancedSelector.dataSourcesPage"
                                defaultMessage="data sources page"
                              />
                            </EuiLink>
                            <br />
                            <FormattedMessage
                              id="data.explorer.datasetSelector.advancedSelector.noDataSourcesActionEnd"
                              defaultMessage="Then re-open this window."
                            />
                          </p>
                        </EuiText>
                      ) : undefined
                    }
                    height="full"
                    className="datasetExplorer__selectable"
                    data-test-subj="datasetExplorerSelectable"
                  >
                    {(list, search) => (
                      <>
                        {isFinal && search}
                        {list}
                      </>
                    )}
                  </EuiSelectable>
                )}
              </div>
            );
          })}
          {visiblePath.length > 0 && !!visiblePath[visiblePath.length - 1]?.hasNext && (
            <LoadingEmptyColumn isLoading={loading} />
          )}
        </div>
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButtonEmpty data-test-subj="datasetSelectorCancel" onClick={onCancel}>
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
          data-test-subj="datasetSelectorNext"
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
  <div
    className="datasetExplorer__column datasetExplorer__column--empty"
    data-test-subj="datasetExplorerEmptyColumn"
  />
);

const LoadingEmptyColumn = ({ isLoading }: { isLoading: boolean }) =>
  isLoading ? (
    <div className="datasetExplorer__column" data-test-subj="datasetExplorerLoadingColumn">
      <EuiTitle
        size="xxs"
        className="datasetExplorer__columnTitle"
        data-test-subj="datasetExplorerLoadingColumnTitle"
      >
        <h3>...</h3>
      </EuiTitle>
      <EuiSelectable
        options={[]}
        singleSelection
        className="datasetExplorer__selectable"
        isLoading
        data-test-subj="datasetExplorerSelectable"
      >
        {(list) => <>{list}</>}
      </EuiSelectable>
    </div>
  ) : (
    <EmptyColumn />
  );

const getMetaIcon = (item: DataStructure) => {
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

const appendIcon = (item: DataStructure) => {
  const metaIcon = getMetaIcon(item);

  const additionalIcons = (item.meta as DataStructureCustomMeta)?.additionalAppendIcons?.map(
    (icon: { tooltip: string; type: string }) => {
      return (
        <EuiFlexItem grow={false} key={icon.tooltip}>
          <EuiIconTip key={icon.tooltip} content={icon.tooltip} type={icon.type} />
        </EuiFlexItem>
      );
    }
  );

  return (
    <EuiToolTip>
      <EuiFlexGroup responsive={false} gutterSize="xs" alignItems="center" wrap={true}>
        {additionalIcons}
        {metaIcon && (
          <EuiFlexItem grow={false} key="metaIcon">
            {metaIcon}
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </EuiToolTip>
  );
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
