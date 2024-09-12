/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const SIDEBAR_PATH = 'docs/_sidebar.md';

export async function checkDevDocs(log, files) {
  files.map((file) => {
    const path = file.getRelativePath();

    if (path === SIDEBAR_PATH) {
      throw Error(
        `The ${SIDEBAR_PATH} file of the developer docs has been modified but is not ready to be committed. This can be done by performing "git add ${SIDEBAR_PATH}" and committing the changes.`
      );
    }
  });
}
