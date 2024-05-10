/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart } from 'src/core/public';

export async function duplicateSavedObjects(
  http: HttpStart,
  objects: any[],
  targetWorkspace: string,
  includeReferencesDeep: boolean = true
) {
  return await http.post('/api/workspaces/_duplicate_saved_objects', {
    body: JSON.stringify({
      objects,
      includeReferencesDeep,
      targetWorkspace,
    }),
  });
}
