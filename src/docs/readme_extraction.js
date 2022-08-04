/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const { readdir, copyFile, mkdir } = require('fs/promises');
const { resolve, relative, dirname } = require('path');
const REPO_ROOT = resolve(__dirname, '../', '../');
const DEST_FOLDER = resolve(REPO_ROOT, 'extracted_readmes');
const omitDirs = ['node_modules'];

async function cp(from, to) {
  const destDir = dirname(to);
  await mkdir(destDir, { recursive: true });
  return copyFile(from, to);
}

function getDestinationForReadme(absPath) {
  return resolve(DEST_FOLDER, relative(REPO_ROOT, absPath));
}

async function findReadmes(dirInfo) {
  return dirInfo.lsResults.filter((res) => res.indexOf('README.md') > -1);
}

/*
interface dirInfo {
  absPath: string,
  lsResults: any
}
*/
async function traverseDirs(pathToDirectory) {
  const fileInfos = await readdir(pathToDirectory, { withFileTypes: true });
  const children = fileInfos
    .filter((f) => omitDirs.filter((omit) => f.name.indexOf(omit) > -1).length === 0)
    .filter((f) => f.isDirectory())
    .map((f) => resolve(pathToDirectory, f.name));
  return [
    {
      absPath: pathToDirectory,
      lsResults: fileInfos.map((dirEnt) => resolve(pathToDirectory, dirEnt.name)),
    },
  ].concat(...(await Promise.all(children.map(traverseDirs))));
}

module.exports.extractReadmes = async function extractReadmes() {
  const dirs = await traverseDirs(REPO_ROOT);
  const readmes = (await Promise.all(dirs.map(findReadmes))).reduce((a, n) => a.concat(n), []);

  await Promise.all(readmes.map((readme) => cp(readme, getDestinationForReadme(readme))));
};
