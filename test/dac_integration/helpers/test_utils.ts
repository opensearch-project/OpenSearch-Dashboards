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

import { DAC_TEST_PREFIX } from './dashboard_fixtures';

/**
 * Type representing a supertest instance from the FTR service.
 */
type SupertestAgent = any;

/**
 * Creates a saved object via the standard saved objects API.
 * Returns the response body.
 */
export async function createSavedObject(
  supertest: SupertestAgent,
  type: string,
  id: string,
  attributes: Record<string, any>,
  references: Array<{ type: string; id: string; name: string }> = []
): Promise<any> {
  const resp = await supertest
    .post(`/api/saved_objects/${type}/${id}`)
    .set('osd-xsrf', 'true')
    .send({ attributes, references })
    .expect(200);
  return resp.body;
}

/**
 * Deletes a saved object via the standard saved objects API.
 * Ignores 404 (already deleted or never existed).
 */
export async function deleteSavedObject(
  supertest: SupertestAgent,
  type: string,
  id: string
): Promise<void> {
  await supertest
    .delete(`/api/saved_objects/${type}/${id}`)
    .set('osd-xsrf', 'true')
    .expect((res: any) => {
      // Accept 200 (deleted) or 404 (not found)
      if (res.status !== 200 && res.status !== 404) {
        throw new Error(`Expected 200 or 404, got ${res.status}: ${JSON.stringify(res.body)}`);
      }
    });
}

/**
 * Cleans up all saved objects that were created by these tests.
 * Objects are identified by the shared DAC_TEST_PREFIX in their IDs.
 */
export async function cleanupDacTestObjects(supertest: SupertestAgent): Promise<void> {
  const types = ['dashboard', 'visualization', 'search', 'index-pattern'];

  for (const type of types) {
    // Find objects with the DaC test prefix
    const resp = await supertest
      .get(`/api/saved_objects/_find?type=${type}&per_page=100&search=${DAC_TEST_PREFIX}&search_fields=id`)
      .set('osd-xsrf', 'true');

    if (resp.status === 200 && resp.body.saved_objects) {
      for (const obj of resp.body.saved_objects) {
        if (obj.id && obj.id.startsWith(DAC_TEST_PREFIX)) {
          await deleteSavedObject(supertest, type, obj.id);
        }
      }
    }

    // Also try to delete by known IDs directly, as search may not find by ID prefix
    // This is a fallback approach
  }
}

/**
 * Waits for the OSD API to be ready by polling the status endpoint.
 * Useful when tests start before the server is fully initialized.
 */
export async function waitForApiReady(
  supertest: SupertestAgent,
  maxRetries: number = 30,
  retryDelayMs: number = 2000
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const resp = await supertest.get('/api/status');
      if (resp.status === 200) {
        return;
      }
    } catch (err) {
      // Server not ready yet
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }

  throw new Error(`OSD API did not become ready after ${maxRetries} attempts`);
}

/**
 * Retrieves a saved object by type and ID. Returns the full response.
 */
export async function getSavedObject(
  supertest: SupertestAgent,
  type: string,
  id: string
): Promise<any> {
  return await supertest.get(`/api/saved_objects/${type}/${id}`).set('osd-xsrf', 'true');
}
