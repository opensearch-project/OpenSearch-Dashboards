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

const path = require('path');

const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');

const { spawnWatch, exec } = require('./process_utils');
const { replaceModules } = require('./replace_modules');
const {
  getPackageInfo,
  getTempDir,
  getLinkInfo,
  writeLinkInfo,
  isLinked,
  linkPackage,
  unlinkPackage,
} = require('./utils');

/**
 * This script is used to handling symlinking elastic charts to kibana.
 * The cli walks you through the require parameters and runs the build
 * in watch mode to facilitate the entire linking process.
 *
 * NOTE: This does **not** rebuild css files, only typescript files
 */
module.exports = async () => {
  // child processes for cleanup
  const cps = [];
  const cleanExit = () => {
    cps.forEach((cp) => cp && cp.kill());
    process.exit(); // eslint-disable-line unicorn/no-process-exit
  };
  process.on('SIGINT', cleanExit); // catch ctrl-c
  process.on('SIGTERM', cleanExit); // catch kill

  const debug = process.argv.includes('--debug');
  const echDir = process.cwd();
  const echPackageContent = await getPackageInfo(echDir);
  const packageName = echPackageContent.name;

  if (packageName !== '@elastic/charts') {
    if (packageName) throw new Error('This script is only designed for use with @elastic/charts');
    throw new Error('No name defined in package.json');
  }

  const tempDir = await getTempDir(echDir, packageName);
  const linkInfo = await getLinkInfo(tempDir);
  const linkedPackages = ['react', 'react-dom', 'redux', 'react-redux'];

  const { action } = await inquirer.prompt({
    name: 'action',
    message: 'Select action',
    type: 'list',
    default: 'link',
    choices: ['Link', 'Unlink', 'Watch mode'],
  });

  if (action === 'Link') {
    const { appLinkRelativePath } = await inquirer.prompt({
      name: 'appLinkRelativePath',
      message: 'Enter path to application directory to link',
      default: '../kibana',
    });
    const kibanaPath = path.resolve(echDir, appLinkRelativePath);
    const kibanaPackageInfo = await getPackageInfo(kibanaPath);

    if (kibanaPackageInfo.name !== 'kibana') {
      console.log(`
Expected app name to be ${chalk.cyan('kibana')}, found ${chalk.cyan(kibanaPackageInfo.name)}.

to link charts with another application use ${chalk.cyan(
        'yarn link',
      )} (see https://classic.yarnpkg.com/en/docs/cli/link/)
`);
      return;
    }

    if (linkInfo.path) {
      if (linkInfo.path !== kibanaPath) {
        console.log(`${chalk.cyan(packageName)} is already linked to ${linkInfo.path}. Please unlink and try again.`);
      }

      if (isLinked(path.join(kibanaPath, 'node_modules', packageName), echDir)) {
        ora(
          `Selected ${chalk.cyan(kibanaPackageInfo.name)} application already has ${chalk.cyan(packageName)} link`,
        ).succeed();
        console.log(`
  To remove this link run ${chalk.cyan('yarn link:charts')} and select the option to ${chalk.bold.underline(
          'Unlink',
        )}`);
        return;
      }
    }

    console.log(`
  Please ensure kibana is bootstrapped and running:
    cd ${kibanaPath}

    ${chalk.dim('# start elasticsearch or configure kibana to point at remote elasticsearch cluster')}
    yarn es snapshot --license trial --password changeme -E node.attr.hot_node=true

    ${chalk.dim('# boostrap and start kibana')}
    yarn kbn bootstrap --no-cache
    yarn start
`);
    await writeLinkInfo(tempDir, {
      name: kibanaPackageInfo.name,
      path: kibanaPath,
      created: new Date(),
    });
    const { isReady } = await inquirer.prompt({
      name: 'isReady',
      message: `Press ${chalk.italic('Y')} to continue when kibana is running or ${chalk.italic('N')} to cancel.`,
      type: 'confirm',
      default: true,
    });

    if (!isReady) {
      console.log('Please ensure kibana is running before linking charts');
      return;
    }

    cps.push(
      await spawnWatch(
        'yarn build:watch --preserveWatchOutput --pretty --noUnusedLocals false --target ES2018 --noUnusedLocals false ',
        packageName,
        {
          debug,
          cwd: echDir,
          errorStr: 'error TS',
          stopStr: 'Found 0 errors. Watching for file changes',
          startStr: 'File change detected. Starting incremental compilation',
          onUpdate: () => replaceModules(echDir, kibanaPath, linkedPackages),
        },
      ),
    );

    // must be run after first build so all assests are visibile to kibana
    await linkPackage(echDir, kibanaPath, packageName);

    const kbnSharedPackage = path.join(kibanaPath, 'packages/kbn-ui-shared-deps');
    cps.push(
      await spawnWatch('yarn kbn:watch', '@kbn/ui-shared-dep', {
        debug,
        cwd: kbnSharedPackage,
        errorStr: 'ERROR',
        stopStr: 'webpack completed',
        startStr: 'Running webpack compilation',
      }),
    );

    await writeLinkInfo(tempDir, {
      name: kibanaPackageInfo.name,
      path: kibanaPath,
      created: new Date(),
    });

    console.log(`
    Link Successful, please keep this tab running to watch for file changes.
    Refresh kibana to see all new file changes, each time files are rebuilt.
    When finished end this process and run ${chalk.cyan(
      'yarn link:charts',
    )} and select the option to ${chalk.bold.underline('Unlink')} to cleanup link changes.
      `);
  } else {
    const kibanaPath = linkInfo.path;
    if (!kibanaPath) {
      ora(`No links found for ${chalk.cyan(packageName)}`).warn();
      return;
    }

    if (action === 'Watch mode') {
      cps.push(
        await spawnWatch(
          'yarn build:watch --preserveWatchOutput --pretty --noUnusedLocals false --target ES2018',
          packageName,
          {
            debug,
            cwd: echDir,
            errorStr: ': error TS',
            stopStr: 'Found 0 errors. Watching for file changes',
            startStr: 'File change detected. Starting incremental compilation',
            onUpdate: () => replaceModules(echDir, kibanaPath, linkedPackages),
          },
        ),
      );

      const kbnSharedPackage = path.join(kibanaPath, 'packages/kbn-ui-shared-deps');
      cps.push(
        await spawnWatch('yarn kbn:watch', '@kbn/ui-shared-dep', {
          debug,
          cwd: kbnSharedPackage,
          errorStr: 'ERROR',
          stopStr: 'webpack completed',
          startStr: 'Running webpack compilation',
        }),
      );

      return;
    }

    try {
      await exec('yarn build', `Restoring build ${chalk.dim(packageName)}`, {
        debug,
        cwd: echDir,
        errorStr: ': error TS',
      });
      const chartsFileRestored = await unlinkPackage(linkInfo.path, packageName, debug);

      await writeLinkInfo(tempDir, {});

      if (chartsFileRestored) {
        try {
          const kbnSharedPackage = path.join(kibanaPath, 'packages/kbn-ui-shared-deps');
          await exec('yarn build --dev', `Restoring build ${chalk.dim('@kbn/ui-shared-dep')}`, {
            debug,
            errorStr: 'ERROR',
            cwd: kbnSharedPackage,
          });

          console.log(`
    Unlink Successful. Kibana has been restored to the pre-linked state.
    Please refresh kibana to see restored state.`);
          return;
        } catch {
          // fallthrough
        }
      }

      console.log(`
  Unlink Complete. Kibana was ${chalk.underline('not')} restored to the pre-linked state. Please run ${chalk.cyan(
        'yarn kbn bootstrap --no-cache',
      )}`);
    } catch {
      console.log(`Unlink Failed. Please fix issues above or run with ${chalk.underline('--debug')} flag.`);
    }
  }
};
