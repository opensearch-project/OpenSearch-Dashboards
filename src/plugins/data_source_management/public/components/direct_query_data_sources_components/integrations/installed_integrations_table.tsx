/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, CSSProperties, useEffect } from 'react';
import {
  EuiSpacer,
  EuiPanel,
  EuiInMemoryTable,
  EuiTitle,
  EuiLink,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldSearch,
  EuiButton,
  EuiIcon,
  EuiText,
  EuiFlyout,
} from '@elastic/eui';
// eslint-disable-next-line no-restricted-imports
import escapeRegExp from 'lodash/escapeRegExp';
import { HttpStart } from 'opensearch-dashboards/public';
import { IntegrationHealthBadge } from './utils';
import { SetupIntegrationForm } from './setup_integration';
import { AvailableIntegrationsTable } from './available_integration_table';
import { INTEGRATIONS_BASE } from '../../../constants';
import {
  DatasourceType,
  AvailableIntegrationsList,
  IntegrationInstanceResult,
} from '../../../../framework/types';

interface IntegrationInstanceTableEntry {
  name: string;
  locator: {
    name: string;
    id: string;
  };
  status: string;
  assets: number;
}

const labelFromDataSourceType = (dsType: DatasourceType): string | null => {
  switch (dsType) {
    case 'S3GLUE':
      return 'S3 Glue';
    case 'PROMETHEUS':
      return null; // TODO Prometheus integrations not supported so no label available
    default:
      // eslint-disable-next-line no-console
      console.error(`Unknown Data Source Type: ${dsType}`);
      return null;
  }
};

const instanceToTableEntry = (
  instance: IntegrationInstanceResult
): IntegrationInstanceTableEntry => {
  return {
    name: instance.name,
    locator: { name: instance.name, id: instance.id },
    status: instance.status,
    assets: (instance.assets ?? []).length,
  };
};

const AddIntegrationButton = ({
  toggleFlyout,
  fill,
}: {
  fill?: boolean;
  toggleFlyout: () => void;
}) => {
  return (
    <EuiButton fill={fill} onClick={toggleFlyout}>
      Add Integrations
    </EuiButton>
  );
};

const NoInstalledIntegrations = ({ toggleFlyout }: { toggleFlyout: () => void }) => {
  return (
    <EuiFlexGroup direction="column" alignItems="center" gutterSize="xs">
      <EuiFlexItem grow={false}>
        <EuiIcon type="iInCircle" glyphName="iInCircle" size="xxl" />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiText textAlign="center">
          {/* Default margin is too wide -- compress it a bit */}
          <p style={{ 'margin-bottom': '8px' } as CSSProperties}>
            <b>There are no installed Integrations</b>
            <br />
            Add integrations to get started.
          </p>
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <AddIntegrationButton toggleFlyout={toggleFlyout} />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export const InstallIntegrationFlyout = ({
  closeFlyout,
  datasourceType,
  datasourceName,
  refreshInstances,
  selectedDataSourceId,
  selectedClusterName,
  http,
}: {
  closeFlyout: () => void;
  datasourceType: DatasourceType;
  datasourceName: string;
  refreshInstances: () => void;
  http: HttpStart;
  selectedDataSourceId?: string;
  selectedClusterName?: string;
}) => {
  const [availableIntegrations, setAvailableIntegrations] = useState({
    hits: [],
  } as AvailableIntegrationsList);

  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (!http) {
      return;
    }
    http.get(`${INTEGRATIONS_BASE}/repository`).then((exists) => {
      setAvailableIntegrations(exists.data);
    });
  }, [http]);

  const s3FilteredIntegrations = {
    hits: availableIntegrations.hits.filter((config) =>
      config.labels?.includes(labelFromDataSourceType(datasourceType) ?? '')
    ),
  };

  const [installingIntegration, setInstallingIntegration] = useState<string | null>(null);
  const maybeCloseFlyout = () => {
    if (!isInstalling) {
      closeFlyout();
    }
  };

  return (
    <EuiFlyout onClose={maybeCloseFlyout} hideCloseButton={isInstalling}>
      {installingIntegration === null ? (
        <AvailableIntegrationsTable
          loading={false}
          data={s3FilteredIntegrations}
          isCardView={true}
          setInstallingIntegration={setInstallingIntegration}
          http={http}
        />
      ) : (
        <SetupIntegrationForm
          selectedClusterName={selectedClusterName}
          selectedDataSourceId={selectedDataSourceId}
          integration={installingIntegration}
          unsetIntegration={() => setInstallingIntegration(null)}
          renderType="flyout"
          forceConnection={
            datasourceType === 'S3GLUE'
              ? {
                  name: datasourceName,
                  type: 's3',
                }
              : undefined
          }
          setIsInstalling={(installing: boolean, success?: boolean) => {
            setIsInstalling(installing);
            if (success) {
              closeFlyout();
              refreshInstances();
            }
          }}
          http={http}
        />
      )}
    </EuiFlyout>
  );
};

export const InstalledIntegrationsTable = ({
  integrations,
  datasourceType,
  datasourceName,
  refreshInstances,
  http,
  selectedDataSourceId,
  selectedClusterName,
}: {
  integrations: IntegrationInstanceResult[];
  datasourceType: DatasourceType;
  datasourceName: string;
  refreshInstances: () => void;
  http: HttpStart;
  selectedDataSourceId?: string;
  selectedClusterName?: string;
}) => {
  const basePathLink = (link: string): string => {
    if (http.basePath) {
      return http.basePath.prepend(link);
    } else {
      return link;
    }
  };

  const INSTALLED_INTEGRATIONS_COLUMNS = [
    {
      field: 'locator',
      name: 'Instance Name',
      render: (locator: { name: string; id: string }) => {
        return (
          <EuiLink
            data-test-subj={`${locator.name}IntegrationLink`}
            href={basePathLink(`/app/integrations#/installed/${locator.id}`)}
          >
            {locator.name}
          </EuiLink>
        );
      },
    },
    {
      field: 'status',
      name: 'Status',
      render: (status: string) => {
        return <IntegrationHealthBadge status={status} />;
      },
    },
    { field: 'assets', name: 'Asset Count' },
  ];

  const [query, setQuery] = useState('');
  const filteredIntegrations = integrations
    .map(instanceToTableEntry)
    .filter((i) => i.name.match(new RegExp(escapeRegExp(query), 'i')));

  const [showAvailableFlyout, setShowAvailableFlyout] = useState(false);
  const toggleFlyout = () => setShowAvailableFlyout((prev) => !prev);

  const integrationsTable = (
    <>
      <EuiTitle>
        <h2>Installed Integrations</h2>
      </EuiTitle>
      <EuiSpacer />
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFieldSearch
            fullWidth
            placeholder="Search..."
            onChange={(queryEvent) => {
              setQuery(queryEvent.target.value);
            }}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <AddIntegrationButton fill={true} toggleFlyout={toggleFlyout} />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
      <EuiInMemoryTable items={filteredIntegrations} columns={INSTALLED_INTEGRATIONS_COLUMNS} />
    </>
  );

  return (
    <>
      <EuiSpacer />
      <EuiPanel>
        {integrations.length > 0 ? (
          integrationsTable
        ) : (
          <NoInstalledIntegrations toggleFlyout={toggleFlyout} />
        )}
      </EuiPanel>
      {showAvailableFlyout ? (
        <InstallIntegrationFlyout
          closeFlyout={() => setShowAvailableFlyout(false)}
          datasourceType={datasourceType}
          datasourceName={datasourceName}
          refreshInstances={refreshInstances}
          http={http}
          selectedDataSourceId={selectedDataSourceId}
          selectedClusterName={selectedClusterName}
        />
      ) : null}
    </>
  );
};
