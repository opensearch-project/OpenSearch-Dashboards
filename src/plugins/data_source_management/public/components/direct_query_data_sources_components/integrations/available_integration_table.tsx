/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButtonGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiInMemoryTable,
  EuiLink,
  EuiPageContent,
  EuiSpacer,
  EuiTableFieldDataColumnType,
  EuiText,
} from '@elastic/eui';
// eslint-disable-next-line no-restricted-imports
import truncate from 'lodash/truncate';
import React, { useState } from 'react';

import { HttpStart } from 'opensearch-dashboards/public';
import { AvailableIntegrationsList } from '../../../../framework/types';
import { badges } from './integration_category_badge_group';

export interface AvailableIntegrationsTableProps {
  loading: boolean;
  data: AvailableIntegrationsList;
  isCardView: boolean;
  setCardView?: (input: boolean) => void;
  filters?: React.JSX.Element;
  setInstallingIntegration?: (integration: string) => void;
  http: HttpStart;
}

export function AvailableIntegrationsTable(props: AvailableIntegrationsTableProps) {
  const integrations = props.data.hits;
  const setInstallingIntegration = props.setInstallingIntegration;
  const http = props.http;

  const basePathLink = (link: string): string => {
    if (http.basePath) {
      return http.basePath.prepend(link);
    } else {
      return link;
    }
  };

  const toggleButtonsIcons = [
    {
      id: '0',
      label: 'list',
      iconType: 'list',
    },
    {
      id: '1',
      label: 'grid',
      iconType: 'grid',
    },
  ];

  const [toggleIconIdSelected, setToggleIconIdSelected] = useState('0');

  const onChangeIcons = (optionId: string) => {
    if (!props.setCardView) {
      return;
    }
    setToggleIconIdSelected(optionId);
    if (optionId === '0') {
      props.setCardView(false);
    } else {
      props.setCardView(true);
    }
  };

  const tableColumns = [
    {
      field: 'name',
      name: 'Name',
      sortable: true,
      truncateText: true,
      render: (_value, record) => {
        if (setInstallingIntegration) {
          return (
            <EuiLink
              data-test-subj={`${record.name}IntegrationLink`}
              onClick={() => setInstallingIntegration(record.name)}
            >
              {truncate(record.displayName || record.name, { length: 100 })}
            </EuiLink>
          );
        } else {
          return (
            <EuiLink
              data-test-subj={`${record.name}IntegrationLink`}
              href={basePathLink(`/app/integrations#/available/${record.name}`)}
            >
              {truncate(record.displayName || record.name, { length: 100 })}
            </EuiLink>
          );
        }
      },
    },
    {
      field: 'description',
      name: 'Description',
      sortable: true,
      truncateText: true,
      render: (_value, record) => (
        <EuiText data-test-subj={`${record.name}IntegrationDescription`}>
          {truncate(record.description, { length: 100 })}
        </EuiText>
      ),
    },
    {
      field: 'categories',
      name: 'Categories',
      sortable: true,
      truncateText: true,
      render: (_value, record) => badges(record.labels ?? []),
    },
  ] as Array<EuiTableFieldDataColumnType<any>>;

  const renderToggle = () => {
    return (
      <EuiFlexGroup>
        <EuiFlexItem>{props.filters}</EuiFlexItem>
        {props.setCardView ? (
          <EuiFlexItem>
            <EuiButtonGroup
              legend="Text align"
              options={toggleButtonsIcons}
              idSelected={toggleIconIdSelected}
              onChange={(id) => onChangeIcons(id)}
              isIconOnly
            />
          </EuiFlexItem>
        ) : null}
      </EuiFlexGroup>
    );
  };

  const search = {
    toolsRight: renderToggle(),
    box: {
      incremental: true,
    },
  };

  return (
    <EuiPageContent id="availableIntegrationsArea">
      <EuiSpacer />
      {integrations.length > 0 ? (
        <EuiInMemoryTable
          loading={props.loading}
          items={integrations}
          itemId="id"
          columns={tableColumns}
          tableLayout="auto"
          pagination={{
            initialPageSize: 10,
            pageSizeOptions: [5, 10, 15],
          }}
          search={search}
          allowNeutralSort={false}
          isSelectable={true}
        />
      ) : (
        <>
          <EuiSpacer size="xxl" />
          <EuiText textAlign="center">
            <h2>No Integrations Available</h2>
          </EuiText>
          <EuiSpacer size="m" />
        </>
      )}
    </EuiPageContent>
  );
}
