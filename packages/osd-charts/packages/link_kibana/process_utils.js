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

const childProcess = require('child_process');

const chalk = require('chalk');
const ora = require('ora');

const printError = (error) =>
  console.log(
    error
      .toString()
      .split('\n')
      .map((line) => `\t${line}`)
      .join('\n'),
  );

const parseBuffer = (buf) => {
  return unescape(escape(buf.toString())).replace(
    // eslint-disable-next-line no-control-regex
    /[\u001B\u009B][#();?[]*(?:\d{1,4}(?:;\d{0,4})*)?[\d<=>A-ORZcf-nqry]/g,
    '',
  );
};

const debugLog = (...args) => console.log(...['\nDEBUG: ', ...args].map((a) => chalk.blue(a)));

const printErrorMsg = () => {
  console.log(chalk.redBright.bold('\n  An Error occured, please resolve the issue(s) below:\n'));
};

const printNodeVersionError = (error, cwd) => {
  if (error.toString().includes('The engine "node" is incompatible with this module')) {
    const [, newVersion] = /Expected version "(.+?)"/.exec(error.toString()) ?? [];
    console.log(`You must update your node version, please run the commands below and try again

cd ${cwd}
nvm install ${newVersion} && nvm use

cd ${process.cwd()}
yarn link:kibana

If you don't use nvm please install the expected node version.
`);
  }
};

const exec = async (command, message, { cwd, errorMsg, errorStr, debug } = {}) => {
  const spinner = ora(message).start();
  await new Promise((resolve, reject) => {
    childProcess.exec(command, { cwd, timeout: 2 * 60 * 1000 }, (error, stdoutBuf, stderrBuf) => {
      const stdout = parseBuffer(stdoutBuf);
      const stderr = parseBuffer(stderrBuf);
      if (debug) {
        if (stdout) debugLog('stdout:\n\n', stdout);
        if (stderr) debugLog('stderr:\n\n', stderr);
        if (error) debugLog('error:\n\n', error);
      }

      if (stdout && !spinner.isSpinning) {
        spinner.start();
      }

      if (errorStr) {
        const errors = [];

        if (stderr && stderr.includes(errorStr)) {
          errors.push(stderr);
        }

        if (stdout && stdout.includes(errorStr)) {
          errors.push(stdout);
        }

        if (errors.length > 0) {
          spinner.fail();
          printErrorMsg();
          errors.forEach(printError);
          reject();
          return;
        }
      }

      if (error) {
        spinner.fail(errorMsg || error);
        printError(error);
        printNodeVersionError(error, cwd);
        reject(error);
        return;
      }

      spinner.succeed();
      resolve(stdout);
    });
  });
};

const spawnWatch = (command, packageName, { cwd, startStr, stopStr, onUpdate, errorStr, debug } = {}) =>
  new Promise((resolve, reject) => {
    console.log(`Starting build of ${chalk.cyan.bold(packageName)} in detatched watch mode`);
    let spinner = ora(`Building initial files ${chalk.dim(packageName)}`).start();

    const cp = childProcess.spawn(command, [], { cwd, detached: true, shell: true });

    if (!stopStr) {
      spinner.succeed();
      resolve();
    } else {
      let hasError = false;
      cp.stdout.on('data', (dataBuffer) => {
        const stdout = parseBuffer(dataBuffer);
        if (debug && stdout) debugLog('stdout:\n\n', stdout);
        if (startStr && !spinner.isSpinning && stdout.includes(startStr)) {
          spinner = ora(`Building changed files ${chalk.dim(packageName)}`).start();
          return;
        }

        if (errorStr) {
          if (stdout.includes(errorStr)) {
            if (!hasError) {
              spinner.fail();
              printErrorMsg();
              hasError = true;
            }
            printError(dataBuffer);
            return;
          }
          hasError = false;
        }

        if (spinner.isSpinning && stdout.includes(stopStr)) {
          spinner.succeed();
          if (onUpdate) onUpdate().then(resolve).catch(reject);
          else resolve();
        }
      });

      if (errorStr) {
        cp.stderr.on('data', (dataBuffer) => {
          const stderr = parseBuffer(dataBuffer);
          if (debug && stderr) debugLog('stderr:\n\n', stderr);
          if (stderr.includes(errorStr)) {
            if (!hasError) {
              spinner.fail();
              printErrorMsg();
              hasError = true;
            }
            printError(dataBuffer);
            return;
          }
          hasError = false;
        });
      }
    }

    cp.on('error', (error) => {
      printError(error);
      spinner.fail(error);
      printNodeVersionError(error, cwd);
      reject(error);
    });

    return cp;
  });

module.exports = { exec, spawnWatch };
