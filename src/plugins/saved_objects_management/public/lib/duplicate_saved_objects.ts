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

import { HttpStart } from 'src/core/public';

export async function duplicateSavedObjects(
  http: HttpStart,
  objects: any[],
  includeReferencesDeep: boolean = true,
  targetWorkspace: string
) {
  return await http.post('/api/saved_objects/_copy', {
    body: JSON.stringify({
      objects,
      includeReferencesDeep,
      targetWorkspace,
    }),
  });
}
