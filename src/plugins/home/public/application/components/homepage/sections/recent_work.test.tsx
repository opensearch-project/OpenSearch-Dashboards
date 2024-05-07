/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { recentWorkSection } from './recent_work';
import {
  HomeOpenSearchDashboardsServices,
  setServices,
} from '../../../opensearch_dashboards_services';
import { createHomeServicesMock } from 'src/plugins/home/public/mocks';
import { BehaviorSubject } from 'rxjs';
import { ChromeRecentlyAccessedHistoryItem } from 'opensearch-dashboards/public';

let mockElement: HTMLElement;
let services: HomeOpenSearchDashboardsServices;

describe('Recent work section', () => {
  beforeAll(() => {
    mockElement = document.createElement('element');
    services = createHomeServicesMock();
  });

  it('renders empty recent work', async () => {
    services.chrome.recentlyAccessed.get$ = () => {
      return new BehaviorSubject<ChromeRecentlyAccessedHistoryItem[]>([]);
    };
    setServices(services);
    recentWorkSection.render(mockElement);
    expect(mockElement).toMatchSnapshot();
  });

  it('renders non-empty recent work sections with visualization and dashboard saved object', async () => {
    services.chrome.recentlyAccessed.get$ = () => {
      return new BehaviorSubject<ChromeRecentlyAccessedHistoryItem[]>([
        {
          link: 'link1',
          label: 'label1',
          id: 'id1',
          type: 'visualization',
        },
        {
          link: 'link2',
          label: 'label2',
          id: 'id2',
          type: 'dashboard',
        },
      ]);
    };
    setServices(services);
    recentWorkSection.render(mockElement);
    expect(mockElement).toMatchSnapshot();
  });
});
