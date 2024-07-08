/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { learnBasicsSection } from './learn_basics';
import { createHomeServicesMock } from 'src/plugins/home/public/mocks';
import {
  HomeOpenSearchDashboardsServices,
  setServices,
} from '../../../opensearch_dashboards_services';

let mockElement: HTMLElement;
let services: HomeOpenSearchDashboardsServices;

describe('Learn basics section', () => {
  beforeAll(() => {
    mockElement = document.createElement('element');
    services = createHomeServicesMock();
  });

  it('is rendered', () => {
    setServices(services);
    learnBasicsSection.render(mockElement);
    expect(mockElement).toMatchSnapshot();
  });
});
