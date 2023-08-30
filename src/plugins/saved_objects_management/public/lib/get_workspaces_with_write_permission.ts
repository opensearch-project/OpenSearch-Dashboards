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
import { WorkspacePermissionMode } from '../../../../core/public';

export async function getWorkspacesWithWritePermission(http: HttpStart) {
  return await http.post('/api/workspaces/_list', {
    body: JSON.stringify({
      permissionModes: [WorkspacePermissionMode.Management, WorkspacePermissionMode.LibraryWrite],
    }),
  });
}
