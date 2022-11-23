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

import { OsdClientStatus } from './osd_client_status';

const EXTENSION_STATUS_ID = /^extension:(.+?)@/;

export class OsdClientExtensions {
  constructor(private readonly status: OsdClientStatus) {}
  /**
   * Get a list of extension ids that are enabled on the server
   */
  public async getEnabledIds() {
    const extensionIds: string[] = [];
    const apiResp = await this.status.get();

    for (const status of apiResp.status.statuses) {
      if (status.extensionId) {
        const match = status.extensionId.match(EXTENSION_STATUS_ID);
        if (match) {
          extensionIds.push(match[1]);
        }
      }
    }

    return extensionIds;
  }
}
