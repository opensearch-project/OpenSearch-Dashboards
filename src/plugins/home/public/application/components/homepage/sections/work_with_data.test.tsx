/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { workWithDataSection } from './work_with_data';
import {
  HomeOpenSearchDashboardsServices,
  setServices,
} from '../../../opensearch_dashboards_services';

import { BehaviorSubject } from 'rxjs';
import { PublicAppInfo } from 'opensearch-dashboards/public';
import { homePluginMock } from 'src/plugins/home/public/mocks/mocks';

let mockElement: HTMLElement;
let services: HomeOpenSearchDashboardsServices;

describe('Work with data section', () => {
  beforeAll(() => {
    mockElement = document.createElement('element');
    services = homePluginMock.createStartContract();
  });

  it('renders without observability card', async () => {
    setServices(services);
    workWithDataSection.render(mockElement);
    expect(mockElement).toMatchSnapshot();
  });

  it('renders with observability card named Set up pre-built dashboards', async () => {
    const app1: PublicAppInfo = {
      id: 'id',
      title: 'title',
      status: 0,
      navLinkStatus: 0,
      appRoute: 'string',
    };
    const app2: PublicAppInfo = {
      id: 'observability-dashboards',
      title: 'observability-dashboards',
      status: 0,
      navLinkStatus: 0,
      appRoute: 'string',
    };
    const appMap: ReadonlyMap<string, PublicAppInfo> = new Map<string, PublicAppInfo>([
      ['app1', app1],
      ['app2', app2],
    ]);
    services.application.applications$ = new BehaviorSubject<ReadonlyMap<string, PublicAppInfo>>(
      appMap
    );

    setServices(services);
    workWithDataSection.render(mockElement);
    expect(mockElement).toMatchSnapshot();
  });
});
