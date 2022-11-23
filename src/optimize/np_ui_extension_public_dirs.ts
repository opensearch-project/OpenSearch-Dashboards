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

import OsdServer from '../legacy/server/osd_server';

export type NpUiExtensionPublicDirs = Array<{
  extensionId: string;
  path: string;
}>;

export function getNpUiExtensionPublicDirs(osdServer: OsdServer): NpUiExtensionPublicDirs {
  return Array.from(osdServer.newPlatform.__internals.uiExtensions.internal.entries()).map(
    ([extensionId, { publicTargetDir }]) => ({
      extensionId,
      path: publicTargetDir,
    })
  );
}

export function isNpUiExtensionPublicDirs(x: any): x is NpUiExtensionPublicDirs {
  return (
    Array.isArray(x) &&
    x.every(
      (s) =>
        typeof s === 'object' &&
        s &&
        typeof s.extensionId === 'string' &&
        typeof s.path === 'string'
    )
  );
}

export function assertIsNpUiExtensionPublicDirs(x: any): asserts x is NpUiExtensionPublicDirs {
  if (!isNpUiExtensionPublicDirs(x)) {
    throw new TypeError(
      'npUiExtensionPublicDirs must be an array of objects with string `extensionId` and `path` properties'
    );
  }
}
