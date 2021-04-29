/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { EMSClient } from '@elastic/ems-client';

export class OpenSearchMapsClient extends EMSClient {
  constructor({ kbnVersion, manifestServiceUrl, language, landingPageUrl, fetchFunction }) {
    super({ kbnVersion, manifestServiceUrl, language, landingPageUrl, fetchFunction });
    this._queryParams = {
      kbn_version: kbnVersion,
      opensearch_tos_agree: true,
    };
    this._manifestServiceUrl = manifestServiceUrl;
  }

  async isEnabled() {
    let result;
    try {
      result = await this._fetchWithTimeout(this._manifestServiceUrl);
    } catch (e) {
      // silently ignoring the exception and returning false.
      return false;
    }
    if (result.ok) {
      const resultJson = await result.json();
      return resultJson.enabled;
    }
    return false;
  }
}
