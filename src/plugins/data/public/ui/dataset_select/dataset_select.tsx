/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  EuiButton,
  EuiSmallButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPopover,
  EuiPopoverFooter,
  EuiSelectable,
  EuiSelectableOption,
  EuiToolTip,
  EuiFormRow,
  EuiBadge,
  EuiHighlight,
  EuiTextColor,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  useOpenSearchDashboards,
  toMountPoint,
} from '../../../../opensearch_dashboards_react/public';
import { DataView, Query } from '../../../common';
import { DEFAULT_DATA } from '../../../common/constants';
import { IDataPluginServices } from '../../types';
import { DatasetDetails } from './dataset_details';
import { AdvancedSelector } from '../dataset_selector/advanced_selector';
import './_index.scss';

export interface DatasetSelectProps {
  onSelect: (dataset: DataView) => void;
  appName: string;
}

/**
 * @experimental This component is experimental and may change in future versions
 */
const DatasetSelect: React.FC<DatasetSelectProps> = ({ onSelect, appName }) => {
  const { services } = useOpenSearchDashboards<IDataPluginServices>();
  const isMounted = useRef(true);
  const initialDatasetSet = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [datasets, setDatasets] = useState<DataView[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DataView | undefined>();
  const [defaultDatasetId, setDefaultDatasetId] = useState<string | undefined>();
  const [, setIsLoading] = useState(true);
  const { data, overlays } = services;
  const {
    dataViews,
    query: { queryString },
  } = data;
  const datasetService = queryString.getDatasetService();

  const extractDataSourceInfo = useCallback((uri?: string): { type?: string; name?: string } => {
    if (!uri) return {};

    if (uri.includes('://')) {
      const parts = uri.split('://');
      if (parts.length >= 2) {
        const type = parts[0].toUpperCase();
        const pathParts = parts[1].split('/');
        const name = pathParts[0];
        return { type, name };
      }
    }

    return { name: uri };
  }, []);

  const getTypeFromUri = useCallback(
    (uri?: string): string | undefined => {
      return extractDataSourceInfo(uri).type;
    },
    [extractDataSourceInfo]
  );

  const fetchDatasets = useCallback(async () => {
    setIsLoading(true);
    try {
      const datasetIds = await dataViews.getIds(true);
      const fetchedDataViews = [];

      for (const id of datasetIds) {
        try {
          const dataView = await dataViews.get(id);
          fetchedDataViews.push(dataView);
        } catch (e) {
          throw new Error(
            i18n.translate('data.datasetSelect.fetchError', {
              defaultMessage: 'Failed to fetch dataset with ID {id}: {error}',
              values: {
                id,
                error: e.message,
              },
            })
          );
        }
      }

      const defaultDataView = await dataViews.getDefault();
      if (defaultDataView && isMounted.current) {
        setDefaultDatasetId(defaultDataView.id);
      }

      if (isMounted.current) {
        setDatasets(fetchedDataViews);
        if (!initialDatasetSet.current && fetchedDataViews.length > 0) {
          // Check if there's already a dataset from query string (URL state)
          const currentQuery = queryString.getQuery();
          const existingDataset = currentQuery?.dataset;

          if (existingDataset) {
            // If there's already a dataset from URL, find it in the fetched datasets
            const urlDataset = fetchedDataViews.find((d) => d.id === existingDataset.id);
            if (urlDataset) {
              setSelectedDataset(urlDataset);
              // Don't call onSelect during initialization if dataset exists in URL
            } else {
              // Fallback to first dataset if URL dataset not found
              setSelectedDataset(fetchedDataViews[0]);
              onSelect(fetchedDataViews[0]);
            }
          } else {
            // No dataset in URL, select first one and call onSelect
            setSelectedDataset(fetchedDataViews[0]);
            onSelect(fetchedDataViews[0]);
          }
          initialDatasetSet.current = true;
        }
        setIsLoading(false);
      }
    } catch (e) {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [dataViews, onSelect, queryString]);

  useEffect(() => {
    isMounted.current = true;
    fetchDatasets();
    return () => {
      isMounted.current = false;
    };
  }, [fetchDatasets]);

  const togglePopover = useCallback(() => setIsOpen(!isOpen), [isOpen]);
  const closePopover = useCallback(() => setIsOpen(false), []);

  const handleOptionChange = useCallback(
    (newOptions: EuiSelectableOption[]) => {
      const selectedOption = newOptions.find((option) => option.checked === 'on');
      if (selectedOption) {
        const dataset = datasets.find((d) => d.id === selectedOption.key);
        if (dataset) {
          setSelectedDataset(dataset);
          closePopover();
          onSelect(dataset);
        }
      }
    },
    [datasets, closePopover, onSelect]
  );

  const buildOptions = useCallback((): EuiSelectableOption[] => {
    return datasets.map((dataset) => {
      const { id, title, displayName, description } = dataset;
      const isSelected = id === selectedDataset?.id;
      const isDefault = id === defaultDatasetId;

      const datasetType =
        getTypeFromUri(dataset.dataSourceRef?.name) ||
        dataset.type ||
        DEFAULT_DATA.SET_TYPES.INDEX_PATTERN;
      const iconType = datasetService.getType(datasetType)?.meta.icon.type || 'database';

      const label = displayName || title;

      return {
        label,
        searchableLabel: description || title,
        key: id,
        checked: isSelected ? 'on' : undefined,
        prepend: <EuiIcon size="s" type={iconType} />,
        'data-test-subj': `datasetOption-${id}`,
        append: isDefault ? (
          <EuiBadge>
            {i18n.translate('data.datasetSelect.defaultLabel', {
              defaultMessage: 'Default',
            })}
          </EuiBadge>
        ) : undefined,
      };
    });
  }, [datasets, selectedDataset, defaultDatasetId, getTypeFromUri, datasetService]);

  const datasetType =
    getTypeFromUri(selectedDataset?.dataSourceRef?.name) ||
    selectedDataset?.type ||
    DEFAULT_DATA.SET_TYPES.INDEX_PATTERN;

  const datasetIcon = datasetService.getType(datasetType)?.meta.icon.type || 'database';

  const datasetTitle = useMemo(() => {
    if (!selectedDataset) {
      return i18n.translate('data.datasetSelect.selectDataLabel', {
        defaultMessage: 'Select data',
      });
    }

    if (selectedDataset.displayName) {
      return selectedDataset.displayName;
    }

    return selectedDataset.title;
  }, [selectedDataset]);

  return (
    <EuiFormRow
      fullWidth={true}
      display="columnCompressed"
      className="datasetSelect"
      label={i18n.translate('data.datasetSelect.formRowLabel', {
        defaultMessage: 'Data',
      })}
    >
      <EuiFlexGroup
        gutterSize="none"
        alignItems="center"
        wrap={false}
        responsive={false}
        className="datasetSelect__container"
      >
        <EuiFlexItem className="datasetSelect__mainContent">
          <EuiPopover
            button={
              <EuiToolTip display="block" content={datasetTitle}>
                <EuiSmallButtonEmpty
                  className="datasetSelect__button"
                  data-test-subj="datasetSelectButton"
                  iconType="arrowDown"
                  iconSide="right"
                  color="text"
                  textProps={{ className: 'datasetSelect__text' }}
                  onClick={togglePopover}
                >
                  <EuiIcon type={datasetIcon} size="s" className="datasetSelect__icon" />
                  {datasetTitle}
                </EuiSmallButtonEmpty>
              </EuiToolTip>
            }
            isOpen={isOpen}
            closePopover={closePopover}
            anchorPosition="downLeft"
            display="block"
            panelPaddingSize="none"
          >
            <EuiSelectable
              className="datasetSelect__selectable"
              data-test-subj="datasetSelectSelectable"
              options={buildOptions()}
              singleSelection="always"
              searchable={true}
              onChange={handleOptionChange}
              renderOption={(option, searchValue) => {
                const description =
                  option.searchableLabel && option.searchableLabel !== option.label
                    ? option.searchableLabel
                    : undefined;

                return (
                  <>
                    <EuiHighlight search={searchValue}>{option.label}</EuiHighlight>
                    {description && (
                      <>
                        <br />
                        <EuiTextColor color="subdued">
                          <small>
                            <EuiHighlight search={searchValue}>{description}</EuiHighlight>
                          </small>
                        </EuiTextColor>
                      </>
                    )}
                  </>
                );
              }}
              listProps={{
                showIcons: false,
                rowHeight: 40,
              }}
              searchProps={{
                placeholder: i18n.translate('data.datasetSelect.searchPlaceholder', {
                  defaultMessage: 'Search',
                }),
                compressed: true,
              }}
            >
              {(list, search) => (
                <>
                  <div className="datasetSelect__searchContainer">{search}</div>
                  {list}
                </>
              )}
            </EuiSelectable>
            <EuiPopoverFooter paddingSize="none">
              <EuiFlexGroup
                justifyContent="spaceBetween"
                alignItems="center"
                responsive={false}
                gutterSize="none"
                className="datasetSelect__footer"
              >
                <EuiFlexItem grow={false} className="datasetSelect__footerItem">
                  <EuiButton
                    className="datasetSelect__advancedButton"
                    data-test-subj="datasetSelectAdvancedButton"
                    iconType="gear"
                    iconSide="right"
                    size="s"
                    isSelected={false}
                    onClick={() => {
                      closePopover();
                      const overlay = overlays?.openModal(
                        toMountPoint(
                          <AdvancedSelector
                            services={services}
                            onSelect={async (query: Partial<Query>) => {
                              overlay?.close();
                              if (query?.dataset) {
                                try {
                                  const { dataSource, timeFieldName } = query.dataset;
                                  const updatedDataset = {
                                    ...query.dataset,
                                    ...(dataSource && {
                                      dataSourceRef: {
                                        id: dataSource.id || '',
                                        name: `${query.dataset.type.toLowerCase()}://${
                                          dataSource.title
                                        }`,
                                        type: dataSource.type,
                                      },
                                    }),
                                    type: query.dataset.type,
                                    timeFieldName,
                                  };

                                  await datasetService.cacheDataset(
                                    updatedDataset,
                                    services,
                                    false
                                  );
                                  setSelectedDataset(updatedDataset as DataView);
                                  onSelect(updatedDataset as DataView);
                                } catch (error) {
                                  services.notifications?.toasts.addError(error, {
                                    title: i18n.translate('data.datasetSelect.errorTitle', {
                                      defaultMessage: 'Error selecting dataset',
                                    }),
                                  });
                                }
                              }
                            }}
                            onCancel={() => overlay?.close()}
                          />
                        ),
                        {
                          maxWidth: false,
                          className: 'datasetSelect__advancedModal',
                        }
                      );
                    }}
                  >
                    <FormattedMessage
                      id="data.datasetSelect.advancedButton"
                      defaultMessage="View all available data"
                    />
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPopoverFooter>
          </EuiPopover>
        </EuiFlexItem>
        <EuiFlexItem grow={false} className="datasetSelect__detailsContainer">
          <DatasetDetails
            dataset={selectedDataset}
            isDefault={selectedDataset?.id === defaultDatasetId}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiFormRow>
  );
};

// eslint-disable-next-line import/no-default-export
export default DatasetSelect;
