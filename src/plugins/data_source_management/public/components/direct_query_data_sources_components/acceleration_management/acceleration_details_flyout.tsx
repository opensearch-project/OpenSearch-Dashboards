/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiIcon,
  EuiSpacer,
  EuiTab,
  EuiTabs,
  EuiText,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { ApplicationStart, HttpStart, NotificationsStart } from 'opensearch-dashboards/public';
import { CachedAcceleration } from '../../../../framework/types';
import { AccelerationActionOverlay } from './acceleration_action_overlay';
import { useAccelerationOperation } from './acceleration_operation';
import { AccelerationDetailsTab } from './flyout_modules/acceleration_details_tab';
import { AccelerationSchemaTab } from './flyout_modules/accelerations_schema_tab';
import {
  AccelerationActionType,
  getAccelerationName,
  onDiscoverIconClick,
} from './acceleration_utils';
// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { OpenSearchDashboardsResponse } from '../../../../../../core/server/http/router';
import { DSL_BASE } from '../../../../framework/utils/shared';
import { getUiSettings } from '../../utils';

export interface AccelerationDetailsFlyoutProps {
  acceleration: CachedAcceleration;
  dataSourceName: string;
  resetFlyout: () => void;
  handleRefresh?: () => void;
  dataSourceMDSId?: string;
  http: HttpStart;
  notifications: NotificationsStart;
  application: ApplicationStart;
  featureFlagStatus: boolean;
}

const fetchFields = async (
  http: HttpStart,
  index: string,
  featureFlagStatus: boolean,
  dataSourceMDSId?: string
) => {
  const endpoint =
    featureFlagStatus && dataSourceMDSId
      ? `${DSL_BASE}/indices.getFieldMapping/dataSourceMDSId=${dataSourceMDSId}`
      : `${DSL_BASE}/indices.getFieldMapping`;

  return http
    .get(endpoint, {
      query: {
        index,
      },
    })
    .then((result) => {
      return result;
    });
};

const fetchSettings = async (
  http: HttpStart,
  index: string,
  featureFlagStatus: boolean,
  dataSourceMDSId?: string
) => {
  const endpoint =
    featureFlagStatus && dataSourceMDSId
      ? `${DSL_BASE}/indices.getFieldSettings/dataSourceMDSId=${dataSourceMDSId}`
      : `${DSL_BASE}/indices.getFieldSettings`;

  return http
    .get(endpoint, {
      query: {
        index,
      },
    })
    .then((result) => {
      return result;
    });
};

const fetchIndices = async (
  http: HttpStart,
  index: string = '',
  featureFlagStatus: boolean,
  dataSourceMDSId?: string
) => {
  const endpoint =
    featureFlagStatus && dataSourceMDSId
      ? `${DSL_BASE}/cat.indices/dataSourceMDSId=${dataSourceMDSId}`
      : `${DSL_BASE}/cat.indices`;

  return http
    .get(endpoint, {
      query: {
        format: 'json',
        index,
      },
    })
    .then((result) => {
      return result;
    });
};

const handleDetailsFetchingPromise = (
  promise: Promise<OpenSearchDashboardsResponse> | undefined,
  action: string
) => {
  return promise!
    .then((data) => ({ status: 'fulfilled', action, data }))
    .catch((error) => ({ status: 'rejected', action, error }));
};

export const AccelerationDetailsFlyout = (props: AccelerationDetailsFlyoutProps) => {
  const {
    dataSourceName,
    acceleration,
    resetFlyout,
    handleRefresh,
    http,
    notifications,
    featureFlagStatus,
    dataSourceMDSId,
    application,
  } = props;
  const { flintIndexName } = acceleration;
  const [selectedTab, setSelectedTab] = useState('details');
  const tabsMap: { [key: string]: any } = {
    details: AccelerationDetailsTab,
    schema: AccelerationSchemaTab,
  };
  const [operationType, setOperationType] = useState<AccelerationActionType | null>(null);
  const [showConfirmationOverlay, setShowConfirmationOverlay] = useState(false);
  const { performOperation, operationSuccess } = useAccelerationOperation(
    props.dataSourceName,
    http,
    notifications,
    dataSourceMDSId
  );

  const displayedIndex = getAccelerationName(acceleration);

  const onConfirmOperation = () => {
    if (operationType && props.acceleration) {
      performOperation(props.acceleration, operationType, featureFlagStatus, dataSourceMDSId);
      setShowConfirmationOverlay(false);
    }
  };

  const onSyncIconClickHandler = () => {
    setOperationType('sync');
    setShowConfirmationOverlay(true);
  };

  const onDeleteIconClickHandler = () => {
    setOperationType('delete');
    setShowConfirmationOverlay(true);
  };

  const onVacuumIconClickHandler = () => {
    setOperationType('vacuum');
    setShowConfirmationOverlay(true);
  };

  const [settings, setSettings] = useState<object>();
  const [mappings, setMappings] = useState();
  const [indexInfo, setIndexInfo] = useState();

  const updateMapping = (result) => {
    setMappings(result);
  };

  const updateSetting = (result, slectedIndex: string) => {
    setSettings(result.data[slectedIndex]);
  };

  const updateIndexInfo = (result) => {
    setIndexInfo(result);
  };

  const getAccDetail = (selectedIndex: string) => {
    Promise.all([
      handleDetailsFetchingPromise(
        fetchFields(http, selectedIndex, featureFlagStatus, dataSourceMDSId),
        'getMappings'
      ),
      handleDetailsFetchingPromise(
        fetchSettings(http, selectedIndex, featureFlagStatus, dataSourceMDSId),
        'getSettings'
      ),
      handleDetailsFetchingPromise(
        fetchIndices(http, selectedIndex, featureFlagStatus, dataSourceMDSId),
        'getIndexInfo'
      ),
    ])
      .then((results) => {
        updateMapping(results[0]);
        updateSetting(results[1], selectedIndex);
        updateIndexInfo(results[2]);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Error in async calls:', error);
      });
  };

  useEffect(() => {
    if (operationSuccess) {
      resetFlyout();
      handleRefresh?.();
      setOperationType(null);
      setShowConfirmationOverlay(false);
    }
  }, [operationSuccess, resetFlyout, handleRefresh]);

  useEffect(() => {
    if (flintIndexName !== undefined && flintIndexName.trim().length > 0) {
      getAccDetail(flintIndexName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flintIndexName]);

  const DiscoverIcon = () => {
    return (
      <EuiButtonEmpty
        isDisabled={(() => {
          try {
            return !getUiSettings().get('query:enhancements:enabled');
          } catch (e) {
            return false;
          }
        })()}
        onClick={() => {
          onDiscoverIconClick(acceleration, dataSourceName, dataSourceMDSId, application);
          resetFlyout();
        }}
      >
        <EuiIcon type={'discoverApp'} size="m" />
      </EuiButtonEmpty>
    );
  };

  const SyncIcon = ({ autoRefresh, status }: { autoRefresh: boolean; status: string }) => {
    if (autoRefresh || status !== 'active') {
      return null;
    }
    return (
      <EuiButtonEmpty onClick={onSyncIconClickHandler}>
        <EuiIcon type="inputOutput" size="m" />
      </EuiButtonEmpty>
    );
  };

  const DeleteIcon = () => {
    return (
      <EuiButtonEmpty onClick={onDeleteIconClickHandler}>
        <EuiIcon type="trash" size="m" />
      </EuiButtonEmpty>
    );
  };

  const VacuumIcon = () => {
    return (
      <EuiButtonEmpty onClick={onVacuumIconClickHandler}>
        <EuiIcon type="broom" size="m" />
      </EuiButtonEmpty>
    );
  };

  const accelerationDetailsTabs = [
    {
      id: 'details',
      name: 'Details',
      disabled: false,
    },
    {
      id: 'schema',
      name: 'Schema',
      disabled: false,
    },
  ];

  const renderTabs = () => {
    return accelerationDetailsTabs.map((tab, tabIndex) => {
      return (
        <EuiTab
          onClick={() => setSelectedTab(tab.id)}
          isSelected={tab.id === selectedTab}
          disabled={tab.disabled}
          key={tabIndex}
        >
          {tab.name}
        </EuiTab>
      );
    });
  };

  const renderTabContent = (tab: string) => {
    let propsForTab;

    switch (tab) {
      case 'details':
        propsForTab = {
          acceleration,
          settings,
          mappings,
          indexInfo,
          dataSourceName,
          resetFlyout,
          application,
          featureFlagStatus,
          dataSourceMDSId,
        };
        break;
      case 'schema':
        propsForTab = { mappings, indexInfo };
        break;
      default:
        return null;
    }

    const TabToDisplay = tabsMap[tab];

    return <TabToDisplay {...propsForTab} />;
  };

  return (
    <>
      <EuiFlyoutHeader hasBorder>
        <EuiFlexGroup direction="row" alignItems="center" gutterSize="m">
          <EuiFlexItem>
            <EuiText>
              <h2 className="panel-title">{displayedIndex}</h2>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <SyncIcon autoRefresh={acceleration.autoRefresh} status={acceleration.status} />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <DiscoverIcon />
          </EuiFlexItem>
          {acceleration.status !== 'deleted' ? (
            <EuiFlexItem grow={false}>
              <DeleteIcon />
            </EuiFlexItem>
          ) : (
            <EuiFlexItem grow={false}>
              <VacuumIcon />
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <EuiTabs style={{ marginBottom: '-25px' }} size="s">
          {renderTabs()}
        </EuiTabs>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>{renderTabContent(selectedTab)}</EuiFlyoutBody>
      {showConfirmationOverlay && operationType && (
        <AccelerationActionOverlay
          isVisible={showConfirmationOverlay}
          actionType={operationType as AccelerationActionType}
          acceleration={acceleration}
          dataSourceName={dataSourceName}
          onCancel={() => setShowConfirmationOverlay(false)}
          onConfirm={onConfirmOperation}
        />
      )}
    </>
  );
};
