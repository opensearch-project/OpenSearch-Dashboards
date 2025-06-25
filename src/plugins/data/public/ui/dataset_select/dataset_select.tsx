/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  EuiSmallButton,
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
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { Dataset } from '../../../common/datasets/datasets/dataset';
import { IDataPluginServices } from '../../types';
import { DatasetDetails } from './dataset_details';
import './_index.scss';

export interface DatasetSelectProps {
  onSelect: (dataset: Dataset) => void;
  appName: string;
}

const DatasetSelect: React.FC<DatasetSelectProps> = ({ onSelect, appName }) => {
  const { services } = useOpenSearchDashboards<IDataPluginServices>();
  const isMounted = useRef(true);
  const [isOpen, setIsOpen] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const datasetsService = services.data.datasets;
  const queryService = services.data.query;
  const datasetService = queryService.queryString.getDatasetService();

  const getTypeFromUri = useCallback((uri?: string): string | undefined => {
    if (!uri) return undefined;

    if (uri.includes('://')) {
      const parts = uri.split('://');
      if (parts.length >= 2) {
        return parts[0].toUpperCase();
      }
    }

    return undefined;
  }, []);

  useEffect(() => {
    isMounted.current = true;

    const fetchDatasets = async () => {
      setIsLoading(true);

      try {
        const datasetIds = await datasetsService.getIds();

        const fetchedDatasets: Dataset[] = [];
        for (const id of datasetIds) {
          try {
            const dataset = await datasetsService.get(id);
            fetchedDatasets.push(dataset);
          } catch (e) {
            throw new Error(
              i18n.translate('data.datasetSelect.fetchError', {
                defaultMessage: 'Failed to fetch dataset with ID {id}: {error}',
                values: { id, error: (e as Error).message },
              })
            );
          }
        }

        if (isMounted.current) {
          setDatasets(fetchedDatasets);

          if (!selectedDataset && fetchedDatasets.length > 0) {
            setSelectedDataset(fetchedDatasets[0]);
            onSelect(fetchedDatasets[0]);
          }

          setIsLoading(false);
        }
      } catch (e) {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    fetchDatasets();

    return () => {
      isMounted.current = false;
    };
  }, [datasetsService, onSelect, selectedDataset]);

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
      const { id, title, displayName, type, description } = dataset;
      const isSelected = id === selectedDataset?.id;

      const datasetType = getTypeFromUri(dataset.dataSourceRef?.name) || dataset.type || '';
      const iconType = datasetService.getType(datasetType)?.meta.icon.type || 'database';

      return {
        label: displayName || title,
        searchableLabel: description || title,
        key: id,
        checked: isSelected ? 'on' : undefined,
        prepend: <EuiIcon type={iconType} />,
        'data-test-subj': `datasetOption-${id}`,
        append: isSelected ? (
          <EuiBadge>
            {i18n.translate('data.datasetSelect.defaultLabel', {
              defaultMessage: 'Default',
            })}
          </EuiBadge>
        ) : undefined,
      };
    });
  }, [datasets, selectedDataset, getTypeFromUri, datasetService]);

  const datasetType =
    getTypeFromUri(selectedDataset?.dataSourceRef?.name) || selectedDataset?.type || '';

  const datasetIcon = datasetService.getType(datasetType)?.meta.icon.type || 'database';
  const datasetTitle = selectedDataset
    ? selectedDataset.displayName || selectedDataset.title
    : i18n.translate('data.datasetSelect.selectDataLabel', {
        defaultMessage: 'Select data',
      });
  return (
    <EuiFormRow
      fullWidth={true}
      display="columnCompressed"
      className="datasetSelect"
      label={i18n.translate('data.datasetSelect.formRowLabel', {
        defaultMessage: 'Dataset',
      })}
    >
      <EuiFlexGroup gutterSize="none" alignItems="center" wrap={false} responsive={false}>
        <EuiFlexItem>
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
                rowHeight: 50,
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
            <EuiPopoverFooter paddingSize="s">
              <EuiFlexGroup
                justifyContent="spaceBetween"
                alignItems="center"
                responsive={false}
                className="datasetSelect__footer"
              >
                <EuiFlexItem grow={false} className="datasetSelect__footerItem">
                  <EuiSmallButtonEmpty
                    onClick={() => {}}
                    data-test-subj="datasetSelectManageButton"
                  >
                    {i18n.translate('data.datasetSelect.manageButton', {
                      defaultMessage: 'Manage',
                    })}
                  </EuiSmallButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false} className="datasetSelect__footerItem">
                  <EuiSmallButton
                    iconType="plusInCircle"
                    onClick={() => {}}
                    data-test-subj="datasetSelectCreateButton"
                  >
                    {i18n.translate('data.dataSelector.createButton', {
                      defaultMessage: 'Create',
                    })}
                  </EuiSmallButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPopoverFooter>
          </EuiPopover>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <DatasetDetails dataset={selectedDataset} />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiFormRow>
  );
};

// eslint-disable-next-line import/no-default-export
export default DatasetSelect;
