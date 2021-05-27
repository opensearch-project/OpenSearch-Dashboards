/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const { createHash } = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const chalk = require('chalk');
const { snakeCase } = require('change-case');

const { exec } = require('./process_utils');

const exists = async (somePath) => {
  try {
    await fs.promises.access(somePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error(error);
    return false;
  }
};

const hashValue = (str) => {
  const hash = createHash('md5');
  hash.update(str);
  return hash.digest('hex');
};

const getPackageInfo = async (pkgDir) => {
  const filePath = pkgDir.endsWith('/package.json') ? pkgDir : path.join(pkgDir, 'package.json');

  try {
    return JSON.parse(await fs.promises.readFile(filePath, { encoding: 'utf8' }));
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Missing package.json file at ${filePath}`);
    }
    throw new Error(error);
  }
};

const createDir = async (dirPath) => {
  try {
    await fs.promises.mkdir(dirPath);
  } catch (error) {
    if (error.code !== 'EEXIST') throw new Error(error);
  }
};

/**
 * Gets or creates temp directory for given package name.
 * Used to store linked information
 */
const getTempDir = async (cwd, packageName) => {
  const tempPrefix = `link_${snakeCase(packageName)}_`;
  const repoHash = hashValue(cwd);
  const tempPkgDirName = (await fs.promises.readdir(os.tmpdir())).find((p) => p.startsWith(tempPrefix));
  const tempPkgDir = tempPkgDirName
    ? path.join(os.tmpdir(), tempPkgDirName)
    : await fs.promises.mkdtemp(path.join(os.tmpdir(), tempPrefix));
  const tempRepoDir = path.join(tempPkgDir, repoHash);
  await createDir(tempRepoDir);

  return tempRepoDir;
};

const getLinkInfo = async (tempPath) => {
  try {
    const infoPath = path.join(tempPath, 'link.json');
    return JSON.parse(await fs.promises.readFile(infoPath, { encoding: 'utf8' }));
  } catch {
    return { links: [] };
  }
};

const writeLinkInfo = async (tempPath, linkInfo) => {
  const infoPath = path.join(tempPath, 'link.json');
  const data = JSON.stringify(linkInfo, null, 2);

  await fs.promises.writeFile(infoPath, data, { encoding: 'utf8' });
};

const isLinked = (dirPath, linkPath) => {
  try {
    if (!fs.lstatSync(dirPath).isSymbolicLink()) {
      return false;
    }
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw new Error(error);
  }

  if (linkPath) {
    // verify linked to expected target
    return fs.readlinkSync(dirPath) === linkPath;
  }

  return true;
};

const restorePackage = async (appDir, packageName, debug) => {
  try {
    const errorMsg = `Unable to restore ${chalk.cyan(packageName)} package in ${chalk.cyan(path.basename(appDir))}`;
    await exec(
      `yarn add ${packageName} --force --exact`,
      `Restoring ${chalk.cyan(packageName)} in ${chalk.cyan(path.basename(appDir))}`,
      {
        debug,
        cwd: appDir,
        errorMsg,
      },
    );
    return true;
  } catch {
    return false;
  }
};

const linkPackage = async (target, linkPath, packageName) => {
  const linkPackagePath = path.join(linkPath, 'node_modules', packageName);
  const relativeLinkPath = path.relative(target, linkPackagePath);
  if (await exists(linkPackagePath)) {
    await fs.promises.rm(linkPackagePath, { recursive: true, force: true });
  }
  await fs.promises.symlink(target, relativeLinkPath);
};

const unlinkPackage = async (linkPath, packageName, debug) => {
  const linkPackagePath = path.join(linkPath, 'node_modules', packageName);

  if (isLinked(linkPackagePath)) {
    await fs.promises.unlink(linkPackagePath);
  }

  return await restorePackage(linkPath, packageName, debug);
};

module.exports = {
  exists,
  hashValue,
  getPackageInfo,
  createDir,
  getTempDir,
  getLinkInfo,
  writeLinkInfo,
  isLinked,
  linkPackage,
  unlinkPackage,
};
