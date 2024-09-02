/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import {
  InstallIntegrationFlyout,
  InstalledIntegrationsTable,
} from './installed_integrations_table';
import { IntegrationInstanceResult } from '../../../../framework/types';
import { HttpStart } from 'opensearch-dashboards/public';

const mockHttp: Partial<HttpStart> = {
  basePath: {
    prepend: (url: string) => url,
  },
  get: jest.fn().mockResolvedValue({
    data: {
      hits: [
        {
          name: 'test_integration',
          version: '1.0.0',
          displayName: 'Test Integration',
          description: 'A test integration',
          labels: ['test'],
        },
      ],
    },
  }),
};

const TEST_INTEGRATION_SEARCH_RESULTS: IntegrationInstanceResult[] = [
  {
    id: 'd5b55c60-e08c-11ee-9c80-ff3b93498fea',
    status: 'available',
    name: 'aws_waf-sample',
    templateName: 'aws_waf',
    dataSource: 'ss4o_logs_waf-aws_waf-sample-sample',
    creationDate: '2024-03-12T16:23:18.053Z',
    assets: [
      {
        assetType: 'index-pattern',
        assetId: '9506c132-f466-4ce3-a875-f187ddec587c',
        status: 'available',
        isDefaultAsset: false,
        description: 'ss4o_logs_waf-aws_waf-sample-sample',
      },
      {
        assetType: 'visualization',
        assetId: '7770e5be-6f10-4435-9773-021c6188bfe5',
        status: 'available',
        isDefaultAsset: false,
        description: 'logs-waf-Top Client IPs',
      },
      {
        assetType: 'dashboard',
        assetId: '36f26341-22f0-49c5-9820-f787afb4090c',
        status: 'available',
        isDefaultAsset: true,
        description: 'logs-waf-dashboard',
      },
    ],
  },
];

describe('Installed Integrations Table test', () => {
  configure({ adapter: new Adapter() });

  it('Renders the installed integrations table', async () => {
    const wrapper = mount(
      <InstalledIntegrationsTable
        integrations={TEST_INTEGRATION_SEARCH_RESULTS}
        datasourceName="unknown"
        datasourceType="S3GLUE"
        refreshInstances={() => {}}
        http={mockHttp as HttpStart}
      />
    );

    expect(wrapper).toMatchSnapshot();
  });

  it('Renders the empty installed integrations table', async () => {
    const wrapper = mount(
      <InstalledIntegrationsTable
        integrations={[]}
        datasourceType="S3GLUE"
        datasourceName="test"
        refreshInstances={() => {}}
        http={mockHttp as HttpStart}
      />
    );

    expect(wrapper).toMatchSnapshot();
  });

  it('Renders the installed integrations table flyout', async () => {
    const wrapper = mount(
      <InstallIntegrationFlyout
        closeFlyout={() => {}}
        datasourceType="S3GLUE"
        datasourceName="test"
        refreshInstances={() => {}}
        http={mockHttp as HttpStart}
      />
    );

    expect(wrapper).toMatchSnapshot();
  });
});
