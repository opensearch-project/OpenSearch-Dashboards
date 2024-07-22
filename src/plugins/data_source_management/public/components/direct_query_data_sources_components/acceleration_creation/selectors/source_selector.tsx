/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-console */

import {
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiDescriptionList,
  EuiDescriptionListDescription,
  EuiDescriptionListTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import producer from 'immer';
import React, { useEffect, useState } from 'react';
import { HttpStart, NotificationsStart } from 'opensearch-dashboards/public';
import { DATACONNECTIONS_BASE } from '../../../../../framework/utils/shared';
import {
  CachedDataSourceStatus,
  CachedDatabase,
  CreateAccelerationForm,
} from '../../../../../framework/types';
import { CatalogCacheManager } from '../../../../../framework/catalog_cache/cache_manager';
import { hasError, validateDataTable, validateDatabase } from '../create/utils';
import { SelectorLoadDatabases } from './selector_helpers/load_databases';
import { SelectorLoadObjects } from './selector_helpers/load_objects';

interface AccelerationDataSourceSelectorProps {
  http: HttpStart;
  notifications: NotificationsStart;
  accelerationFormData: CreateAccelerationForm;
  setAccelerationFormData: React.Dispatch<React.SetStateAction<CreateAccelerationForm>>;
  selectedDatasource: string;
  dataSourcesPreselected: boolean;
  tableFieldsLoading: boolean;
  dataSourceMDSId?: string;
}

export const AccelerationDataSourceSelector = ({
  http,
  notifications,
  accelerationFormData,
  setAccelerationFormData,
  selectedDatasource,
  dataSourcesPreselected,
  tableFieldsLoading,
  dataSourceMDSId,
}: AccelerationDataSourceSelectorProps) => {
  const [databases, setDatabases] = useState<Array<EuiComboBoxOptionOption<string>>>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<Array<EuiComboBoxOptionOption<string>>>(
    []
  );
  const [tables, setTables] = useState<Array<EuiComboBoxOptionOption<string>>>([]);
  const [selectedTable, setSelectedTable] = useState<Array<EuiComboBoxOptionOption<string>>>([]);
  const [loadingComboBoxes, setLoadingComboBoxes] = useState({
    dataSource: false,
    database: false,
    dataTable: false,
  });

  const dataSourceDescription = (
    <EuiDescriptionList>
      <EuiDescriptionListTitle>Data source</EuiDescriptionListTitle>
      <EuiDescriptionListDescription>
        {accelerationFormData.dataSource}
      </EuiDescriptionListDescription>
    </EuiDescriptionList>
  );

  const loadDataSource = () => {
    setLoadingComboBoxes({ ...loadingComboBoxes, dataSource: true });
    http
      .get(`${DATACONNECTIONS_BASE}/dataSourceMDSId=${dataSourceMDSId ?? ''}`)
      .then((res) => {
        const isValidDataSource = res.some(
          (connection: any) =>
            connection.connector.toUpperCase() === 'S3GLUE' &&
            connection.name === selectedDatasource
        );

        if (!isValidDataSource) {
          notifications.toasts.addDanger(
            `Received an invalid datasource in create acceleration flyout`
          );
        }
      })
      .catch((err) => {
        console.error(err);
        notifications.toasts.addDanger(`failed to load datasources`);
      });
    setLoadingComboBoxes({ ...loadingComboBoxes, dataSource: false });
  };

  const loadDatabases = () => {
    const dsCache = CatalogCacheManager.getOrCreateDataSource(
      accelerationFormData.dataSource,
      dataSourceMDSId
    );

    if (dsCache.status === CachedDataSourceStatus.Updated && dsCache.databases.length > 0) {
      const databaseLabels = dsCache.databases.map((db) => ({ label: db.name }));
      setDatabases(databaseLabels);
    } else if (
      (dsCache.status === CachedDataSourceStatus.Updated && dsCache.databases.length === 0) ||
      dsCache.status === CachedDataSourceStatus.Empty
    ) {
      setDatabases([]);
    }

    setSelectedDatabase([]);
    setTables([]);
    setSelectedTable([]);
    setAccelerationFormData({ ...accelerationFormData, database: '', dataTable: '' });
  };

  const loadTables = () => {
    if (selectedDatabase.length > 0) {
      let dbCache = {} as CachedDatabase;
      try {
        dbCache = CatalogCacheManager.getDatabase(
          accelerationFormData.dataSource,
          accelerationFormData.database,
          dataSourceMDSId
        );
        if (dbCache.status === CachedDataSourceStatus.Updated && dbCache.tables.length > 0) {
          const tableLabels = dbCache.tables.map((tb) => ({ label: tb.name }));
          setTables(tableLabels);
        } else if (
          (dbCache.status === CachedDataSourceStatus.Updated && dbCache.tables.length === 0) ||
          dbCache.status === CachedDataSourceStatus.Empty
        ) {
          setTables([]);
        }
      } catch (error) {
        setTables([]);
        notifications.toasts.addWarning('Your cache is outdated, refresh databases and tables');
        console.error(error);
      }
      setSelectedTable([]);
      setAccelerationFormData({ ...accelerationFormData, dataTable: '' });
    }
  };

  useEffect(() => {
    loadDataSource();
  }, []);

  useEffect(() => {
    if (accelerationFormData.dataSource !== '') {
      loadDatabases();
    }
  }, [accelerationFormData.dataSource]);

  useEffect(() => {
    if (accelerationFormData.database !== '') {
      loadTables();
    }
  }, [accelerationFormData.database]);

  return (
    <>
      <EuiText data-test-subj="datasource-selector-header">
        <h3>Select data source</h3>
      </EuiText>
      <EuiSpacer size="s" />
      <EuiText size="s" color="subdued">
        Select the data source to accelerate data from. External data sources may take time to load.
      </EuiText>
      <EuiSpacer size="m" />

      {dataSourcesPreselected ? (
        <>
          <EuiFlexGroup>
            <EuiFlexItem>{dataSourceDescription}</EuiFlexItem>
            <EuiFlexItem>
              <EuiDescriptionList>
                <EuiDescriptionListTitle>Database</EuiDescriptionListTitle>
                <EuiDescriptionListDescription>
                  {accelerationFormData.database}
                </EuiDescriptionListDescription>
              </EuiDescriptionList>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiDescriptionList>
                <EuiDescriptionListTitle>Table</EuiDescriptionListTitle>
                <EuiDescriptionListDescription>
                  {accelerationFormData.dataTable}
                </EuiDescriptionListDescription>
              </EuiDescriptionList>
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      ) : (
        <>
          {dataSourceDescription}
          <EuiSpacer size="m" />
          <EuiFormRow
            label="Database"
            helpText="Select the database that contains the tables you'd like to use."
            isInvalid={hasError(accelerationFormData.formErrors, 'databaseError')}
            error={accelerationFormData.formErrors.databaseError}
          >
            <EuiFlexGroup gutterSize="s">
              <EuiFlexItem>
                <EuiComboBox
                  placeholder="Select a database"
                  singleSelection={{ asPlainText: true }}
                  options={databases}
                  selectedOptions={selectedDatabase}
                  onChange={(databaseOptions) => {
                    if (databaseOptions.length > 0) {
                      setAccelerationFormData(
                        producer((accData) => {
                          accData.database = databaseOptions[0].label;
                          accData.formErrors.databaseError = validateDatabase(
                            databaseOptions[0].label
                          );
                        })
                      );
                      setSelectedDatabase(databaseOptions);
                    }
                  }}
                  isClearable={false}
                  isInvalid={hasError(accelerationFormData.formErrors, 'databaseError')}
                  isDisabled={
                    loadingComboBoxes.database || loadingComboBoxes.dataTable || tableFieldsLoading
                  }
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <SelectorLoadDatabases
                  dataSourceName={accelerationFormData.dataSource}
                  loadDatabases={loadDatabases}
                  loadingComboBoxes={loadingComboBoxes}
                  setLoadingComboBoxes={setLoadingComboBoxes}
                  tableFieldsLoading={tableFieldsLoading}
                  dataSourceMDSId={dataSourceMDSId}
                  http={http}
                  notifications={notifications}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFormRow>
          <EuiFormRow
            label="Table"
            helpText={
              tableFieldsLoading
                ? 'Loading tables fields'
                : 'Select the Spark table that has the data you would like to index.'
            }
            isInvalid={hasError(accelerationFormData.formErrors, 'dataTableError')}
            error={accelerationFormData.formErrors.dataTableError}
          >
            <EuiFlexGroup gutterSize="s">
              <EuiFlexItem>
                <EuiComboBox
                  placeholder="Select a table"
                  singleSelection={{ asPlainText: true }}
                  options={tables}
                  selectedOptions={selectedTable}
                  onChange={(tableOptions) => {
                    if (tableOptions.length > 0) {
                      setAccelerationFormData(
                        producer((accData) => {
                          accData.dataTable = tableOptions[0].label;
                          accData.formErrors.dataTableError = validateDataTable(
                            tableOptions[0].label
                          );
                        })
                      );
                      setSelectedTable(tableOptions);
                    }
                  }}
                  isClearable={false}
                  isInvalid={hasError(accelerationFormData.formErrors, 'dataTableError')}
                  isDisabled={
                    loadingComboBoxes.database || loadingComboBoxes.dataTable || tableFieldsLoading
                  }
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <SelectorLoadObjects
                  dataSourceName={accelerationFormData.dataSource}
                  databaseName={accelerationFormData.database}
                  loadTables={loadTables}
                  loadingComboBoxes={loadingComboBoxes}
                  setLoadingComboBoxes={setLoadingComboBoxes}
                  tableFieldsLoading={tableFieldsLoading}
                  dataSourceMDSId={dataSourceMDSId}
                  notifications={notifications}
                  http={http}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFormRow>
        </>
      )}
    </>
  );
};
