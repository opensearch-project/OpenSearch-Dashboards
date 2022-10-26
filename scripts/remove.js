/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint no-restricted-syntax: 0 */
const del = require('del');
const path = require('path');

if (!process.argv.includes(__filename)) {
  console.error('Usage: node scripts/remove.js <target ...>');
  process.exit(1);
}

const toDeletes = process.argv
  .slice(process.argv.indexOf(__filename + 1))
  .map((item) => path.resolve(item));

if (toDeletes.length === 0) {
  console.warn('Nothing to delete');
  process.exit(0);
}

(async () => {
  const deletedPaths = await del(toDeletes);
  if (deletedPaths === 0) {
    console.warn('Nothing deleted');
  } else {
    console.log('Deleted files and directories:\n\t', deletedPaths.join('\n\t'));
  }
})();
