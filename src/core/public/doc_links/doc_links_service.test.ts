/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { DocLinksService } from './doc_links_service';
import { injectedMetadataServiceMock } from '../injected_metadata/injected_metadata_service.mock';

describe('DocLinksService#start()', () => {
  it('templates the doc links with the branch information from injectedMetadata', () => {
    const injectedMetadata = injectedMetadataServiceMock.createStartContract();
    injectedMetadata.getOpenSearchDashboardsBranch.mockReturnValue('test-branch');
    const service = new DocLinksService();
    const api = service.start({ injectedMetadata });
    expect(api.DOC_LINK_VERSION).toEqual('test-branch');
    expect(api.links.opensearchDashboards.introduction).toEqual(
      'https://opensearch.org/docs/test-branch/dashboards/index/'
    );
  });

  it('templates the doc links with the main branch from injectedMetadata', () => {
    const injectedMetadata = injectedMetadataServiceMock.createStartContract();
    injectedMetadata.getOpenSearchDashboardsBranch.mockReturnValue('main');
    const service = new DocLinksService();
    const api = service.start({ injectedMetadata });
    expect(api.DOC_LINK_VERSION).toEqual('latest');
    expect(api.links.opensearchDashboards.introduction).toEqual(
      'https://opensearch.org/docs/latest/dashboards/index/'
    );
  });

  it('templates the doc links with the release branch from injectedMetadata', () => {
    const injectedMetadata = injectedMetadataServiceMock.createStartContract();
    injectedMetadata.getOpenSearchDashboardsBranch.mockReturnValue('1.1');
    const service = new DocLinksService();
    const api = service.start({ injectedMetadata });
    expect(api.DOC_LINK_VERSION).toEqual('1.1');
    expect(api.links.opensearchDashboards.introduction).toEqual(
      'https://opensearch.org/docs/1.1/dashboards/index/'
    );
  });

  it('templates the doc links with the build version from injectedMetadata', () => {
    const injectedMetadata = injectedMetadataServiceMock.createStartContract();
    injectedMetadata.getOpenSearchDashboardsBranch.mockReturnValue('test-branch');
    injectedMetadata.getOpenSearchDashboardsVersion.mockReturnValue('1.1.2');
    const service = new DocLinksService();
    const api = service.start({ injectedMetadata });
    expect(api.DOC_LINK_VERSION).toEqual('1.1');
    expect(api.links.opensearchDashboards.introduction).toEqual(
      'https://opensearch.org/docs/1.1/dashboards/index/'
    );
  });
});
