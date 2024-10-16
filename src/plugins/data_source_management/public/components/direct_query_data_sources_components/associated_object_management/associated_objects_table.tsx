/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiInMemoryTable,
  EuiLink,
  EuiTableFieldDataColumnType,
  SearchFilterConfig,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useEffect, useState } from 'react';
import { ApplicationStart } from 'opensearch-dashboards/public';
import { ACCELERATION_INDEX_TYPES } from '../../../../framework/constants';
import { AssociatedObject, CachedAcceleration } from '../../../../framework/types';
import {
  getRenderAccelerationDetailsFlyout,
  getRenderAssociatedObjectsDetailsFlyout,
  getRenderCreateAccelerationFlyout,
} from '../../../plugin';
import { getAccelerationName } from '../acceleration_management/acceleration_utils';
import {
  ASSC_OBJ_TABLE_ACC_COLUMN_NAME,
  ASSC_OBJ_TABLE_SEARCH_HINT,
  ASSC_OBJ_TABLE_SUBJ,
  redirectToDiscoverOSIdx,
  redirectToDiscoverWithDataSrc,
} from './utils/associated_objects_tab_utils';
import { getUiSettings } from '../../utils';

interface AssociatedObjectsTableProps {
  datasourceName: string;
  associatedObjects: AssociatedObject[];
  cachedAccelerations: CachedAcceleration[];
  handleRefresh: () => void;
  application: ApplicationStart;
  dataSourceMDSId?: string;
}

interface FilterOption {
  value: string;
  text: string;
}

interface AssociatedTableFilter {
  type: string;
  field: string;
  operator: string;
  value: string;
}

export const AssociatedObjectsTable = (props: AssociatedObjectsTableProps) => {
  const {
    datasourceName,
    associatedObjects,
    cachedAccelerations,
    handleRefresh,
    application,
    dataSourceMDSId,
  } = props;
  const [accelerationFilterOptions, setAccelerationFilterOptions] = useState<FilterOption[]>([]);
  const [filteredObjects, setFilteredObjects] = useState<AssociatedObject[]>([]);

  const columns = [
    {
      field: 'name',
      name: i18n.translate('dataSourcesManagement.associatedObjectsTab.column.name', {
        defaultMessage: 'Name',
      }),
      sortable: true,
      'data-test-subj': 'nameCell',
      render: (name: string, item: AssociatedObject) => (
        <EuiLink
          onClick={() => {
            if (item.type === 'table') {
              renderAssociatedObjectsDetailsFlyout({
                tableDetail: item,
                dataSourceName: datasourceName,
                handleRefresh,
                dataSourceMDSId,
              });
            } else {
              const acceleration = cachedAccelerations.find((acc) => acc.indexName === item.id);
              if (acceleration) {
                renderAccelerationDetailsFlyout({
                  acceleration,
                  dataSourceName: datasourceName,
                  dataSourceMDSId,
                });
              }
            }
          }}
        >
          {name}
        </EuiLink>
      ),
    },
    {
      field: 'type',
      name: i18n.translate('dataSourcesManagement.associatedObjectsTab.column.type', {
        defaultMessage: 'Type',
      }),
      sortable: true,
      render: (type) => {
        if (type === 'table') return 'Table';
        return ACCELERATION_INDEX_TYPES.find((accType) => type === accType.value)!.label;
      },
    },
    {
      field: 'accelerations',
      name: i18n.translate('dataSourcesManagement.associatedObjectsTab.column.accelerations', {
        defaultMessage: 'Associations',
      }),
      sortable: true,
      render: (accelerations: CachedAcceleration[] | AssociatedObject, obj: AssociatedObject) => {
        if (Array.isArray(accelerations)) {
          if (accelerations.length === 0) {
            return '-';
          } else if (accelerations.length === 1) {
            const name = getAccelerationName(accelerations[0]);
            return (
              <EuiLink
                onClick={() =>
                  renderAccelerationDetailsFlyout({
                    acceleration: accelerations[0],
                    dataSourceName: datasourceName,
                    handleRefresh,
                    dataSourceMDSId,
                  })
                }
              >
                {name}
              </EuiLink>
            );
          }
          return (
            <EuiLink
              onClick={() =>
                renderAssociatedObjectsDetailsFlyout({
                  tableDetail: obj,
                  dataSourceName: datasourceName,
                  handleRefresh,
                  dataSourceMDSId,
                })
              }
            >
              View all {accelerations.length}
            </EuiLink>
          );
        } else if (accelerations) {
          return (
            <EuiLink
              onClick={() =>
                renderAssociatedObjectsDetailsFlyout({
                  tableDetail: accelerations,
                  dataSourceName: datasourceName,
                  handleRefresh,
                  dataSourceMDSId,
                })
              }
            >
              {accelerations.name}
            </EuiLink>
          );
        }
      },
    },
    {
      name: i18n.translate('dataSourcesManagement.associatedObjectsTab.column.actions', {
        defaultMessage: 'Actions',
      }),
      actions: [
        {
          name: i18n.translate('dataSourcesManagement.associatedObjectsTab.action.discover.name', {
            defaultMessage: 'Discover',
          }),
          description: i18n.translate(
            'dataSourcesManagement.associatedObjectsTab.action.discover.description',
            {
              defaultMessage: 'Query in Discover',
            }
          ),
          enabled: () => {
            try {
              return getUiSettings().get('query:enhancements:enabled');
            } catch (e) {
              return false;
            }
          },
          type: 'icon',
          icon: 'discoverApp',
          onClick: (asscObj: AssociatedObject) => {
            if (asscObj.type === 'covering' || asscObj.type === 'materialized') {
              // find the flint index name through the cached acceleration
              const acceleration = cachedAccelerations.find(
                (acc) => getAccelerationName(acc) === asscObj.name
              );
              redirectToDiscoverOSIdx(acceleration!.flintIndexName, dataSourceMDSId, application);
            } else if (asscObj.type === 'table' || asscObj.type === 'skipping') {
              redirectToDiscoverWithDataSrc(
                asscObj.datasource,
                dataSourceMDSId,
                asscObj.database,
                asscObj.tableName,
                application
              );
            }
          },
        },
        {
          name: i18n.translate(
            'dataSourcesManagement.associatedObjectsTab.action.accelerate.name',
            {
              defaultMessage: 'Accelerate',
            }
          ),
          description: i18n.translate(
            'dataSourcesManagement.associatedObjectsTab.action.accelerate.description',
            {
              defaultMessage: 'Accelerate this object',
            }
          ),
          type: 'icon',
          icon: 'bolt',
          available: (item: AssociatedObject) => item.type === 'table',
          onClick: (item: AssociatedObject) =>
            renderCreateAccelerationFlyout({
              dataSourceName: datasourceName,
              databaseName: item.database,
              tableName: item.tableName,
              handleRefresh,
              dataSourceMDSId,
            }),
        },
      ],
    },
  ] as Array<EuiTableFieldDataColumnType<AssociatedObject>>;

  const onSearchChange = ({ query, error }) => {
    if (error) {
      // eslint-disable-next-line no-console
      console.log('Search error:', error);
      return;
    }

    const matchesClauses = (
      associatedObject: AssociatedObject,
      clauses: AssociatedTableFilter[]
    ): boolean => {
      if (clauses.length === 0) return true;

      return clauses.some((clause) => {
        if (clause.field !== ASSC_OBJ_TABLE_ACC_COLUMN_NAME) {
          return associatedObject[clause.field] === clause.value;
        } else if (clause.field === ASSC_OBJ_TABLE_ACC_COLUMN_NAME) {
          return associatedObject.type !== 'table' && associatedObject.name === clause.value;
        }

        return false;
      });
    };

    const filtered = associatedObjects.filter((obj) => {
      const clauses = query.ast._clauses;
      return matchesClauses(obj, clauses);
    });

    setFilteredObjects(filtered);
  };

  const searchFilters = [
    {
      type: 'field_value_selection',
      field: 'accelerations',
      name: 'Accelerations',
      multiSelect: true,
      options: accelerationFilterOptions,
      cache: 60000,
    },
  ] as SearchFilterConfig[];

  const tableSearch = {
    filters: searchFilters,
    box: {
      incremental: true,
      placeholder: ASSC_OBJ_TABLE_SEARCH_HINT,
      schema: {
        fields: { name: { type: 'string' }, database: { type: 'string' } },
      },
    },
    onChange: onSearchChange,
  };

  const pagination = {
    initialPageSize: 10,
    pageSizeOptions: [10, 25, 50],
  };

  const sorting = {
    sort: {
      field: 'name',
      direction: 'asc',
    },
  };

  useEffect(() => {
    const accelerationOptions = Array.from(
      new Set(
        associatedObjects
          .filter((obj) => obj.type !== 'table')
          .flatMap((obj) => obj.name)
          .filter(Boolean)
      )
    )
      .sort()
      .map((name) => ({ value: name, text: name }));
    setAccelerationFilterOptions(accelerationOptions);
    setFilteredObjects(associatedObjects);
  }, [associatedObjects]);

  const renderAccelerationDetailsFlyout = getRenderAccelerationDetailsFlyout();
  const renderAssociatedObjectsDetailsFlyout = getRenderAssociatedObjectsDetailsFlyout();
  const renderCreateAccelerationFlyout = getRenderCreateAccelerationFlyout();

  return (
    <EuiInMemoryTable
      items={filteredObjects}
      columns={columns}
      search={tableSearch}
      pagination={pagination}
      sorting={sorting}
      hasActions={true}
      tableLayout="auto"
      data-test-subj={ASSC_OBJ_TABLE_SUBJ}
    />
  );
};
