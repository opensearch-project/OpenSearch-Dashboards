/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const SIDEBAR_PATH = 'docs/_sidebar.md';

export async function checkDevDocs(log, files) {
  files.map((file) => {
    const path = file.getRelativePath();

    if (path === SIDEBAR_PATH) {
      throw Error(`Please stage the ${SIDEBAR_PATH} to update the developer docs`);
    }
  });
}
