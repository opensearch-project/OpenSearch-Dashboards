/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint no-restricted-syntax: 0 */

const fs = require('fs/promises');

/**
 * Some libraries pack their demos and examples into their release artifacts.
 * This unwanted content makes our release artifacts larger but more importantly,
 * some contain in-browser references to outdated and vulnerable versions of
 * libraries that are not even mentioned in the dependency tree. This is a
 * problem when vulnerability scanners point them out, and we have no way to fix
 * them. This function looks for folders that are unwanted and deletes them.
 */
const removeUnwantedFolders = async (root, unwantedNames) => {
  const items = await fs.readdir(root, { withFileTypes: true });
  const promises = [];
  for (const item of items) {
    if (!item.isDirectory()) continue;

    if (unwantedNames.includes(item.name)) {
      promises.push(fs.rm(`${root}/${item.name}`, { recursive: true, force: true }));
    } else {
      promises.push(...(await removeUnwantedFolders(`${root}/${item.name}`, unwantedNames)));
    }
  }

  return promises;
};
const run = async () => {
  const promises = await removeUnwantedFolders('node_modules', ['demo', 'example', 'examples']);
  await Promise.all(promises);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
