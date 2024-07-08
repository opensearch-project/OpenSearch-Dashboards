/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { learnBasicsSection } from './learn_basics';
import {
  HomeOpenSearchDashboardsServices,
  setServices,
} from '../../../opensearch_dashboards_services';
import { homePluginMock } from 'src/plugins/home/public/mocks/mocks';

let mockElement: HTMLElement;
let services: HomeOpenSearchDashboardsServices;

describe('Learn basics section', () => {
  beforeAll(() => {
    mockElement = document.createElement('element');
    services = homePluginMock.createStartContract();
  });

  it('is rendered', () => {
    setServices(services);
    learnBasicsSection.render(mockElement);
    expect(mockElement).toMatchSnapshot();
  });
});
