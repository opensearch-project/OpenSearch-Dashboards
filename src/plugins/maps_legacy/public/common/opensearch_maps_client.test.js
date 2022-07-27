/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchMapsClient } from './opensearch_maps_client.js';

describe('opensearch_maps_client test without Internet', function () {
  const noInternetManifestUrl = 'https://manifest.foobar';
  const defaultClientConfig = {
    appName: 'opensearch-dashboards',
    osdVersion: '1.2.3',
    language: 'en',
    landingPageUrl: '',
    fetchFunction: function (...args) {
      return fetch(...args);
    },
  };

  function makeOpenSearchMapsClient() {
    const openSearchMapsClient = new OpenSearchMapsClient({
      ...defaultClientConfig,
      manifestServiceUrl: noInternetManifestUrl,
    });
    return openSearchMapsClient;
  }

  it('isEnabled() should return true when catch error', async function () {
    const mapsClient = makeOpenSearchMapsClient();
    const osmIsEnabled = await mapsClient.isEnabled();
    expect(osmIsEnabled).toEqual(true);
  });
});
