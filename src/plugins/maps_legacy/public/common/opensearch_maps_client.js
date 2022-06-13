/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EMSClient } from '@elastic/ems-client';

export class OpenSearchMapsClient extends EMSClient {
  constructor({ osdVersion, manifestServiceUrl, language, landingPageUrl, fetchFunction }) {
    super({ osdVersion, manifestServiceUrl, language, landingPageUrl, fetchFunction });
    this._queryParams = {
      osd_version: osdVersion,
      opensearch_tos_agree: true,
    };
    this._manifestServiceUrl = manifestServiceUrl;
  }

  async isEnabled() {
    let result;
    try {
      result = await this._fetchWithTimeout(this._manifestServiceUrl);
    } catch (e) {
      // silently ignoring the exception and returning true to make sure
      // OpenSearchMapsClient is still enabled when can't access OpenSearch maps service.
      return true;
    }
    if (result.ok) {
      const resultJson = await result.json();
      return resultJson.enabled;
    }
    return false;
  }
}
