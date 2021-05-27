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

const fs = require('fs');
const path = require('path');

const chalk = require('chalk');
const glob = require('glob');
const ora = require('ora');

const addConsoleFlag = (dirPath) => {
  const filePath = path.join(dirPath, 'dist/index.js');
  try {
    const existingContent = fs.readFileSync(filePath, 'utf8');
    const appendContent = `

// LINKED CONSOLE FLAG
console.log(
  '\\n%cLinked @elastic/charts!',
  'font-weight: bold; font-size: 30px;color: #f04d9a; text-shadow: 2px 2px 0 #14abf5 , 4px 4px 0 #fec709 , 6px 6px 0 #00c1b4',
  '\\n\\nlast updated ' + require('moment')(${Date.now()}).fromNow(),
  '\\ndir:', '${dirPath}\\n\\n',
);
`;

    if (existingContent.includes('// LINKED CONSOLE FLAG')) {
      const newContent = existingContent.replace(/(\n)*\/\/ linked console flag(.|\n)+$/gi, appendContent);
      fs.writeFileSync(filePath, newContent);
    } else {
      fs.appendFileSync(filePath, appendContent);
    }
  } catch {
    // unable to add console flag
  }
};

const replaceModules = async (libDir, appDir, linkedPackages) => {
  if (linkedPackages.length === 0) return;

  const spinner = ora(`Replacing package links ${chalk.dim(`(${linkedPackages.join(',')})`)}`).start();

  await new Promise((resolve, reject) => {
    const cwd = path.join(libDir, 'dist');
    // TODO find out why this path doesn't work with the linked lib
    // const moduleDir = path.join(appDir, 'node_modules');
    const moduleDir = path.join(path.dirname(appDir), '../../', path.basename(appDir), 'node_modules');
    const re = new RegExp(`require\\("(?:.*?\\/)*(${linkedPackages.join('|')})"\\)`, 'g');

    glob('**/*.js', { ignore: ['**/*.map.js'], cwd }, (error, files) => {
      if (error) {
        spinner.fail(error);
        reject(error);
      }

      files.forEach((file) => {
        const fullPath = path.join(cwd, file);
        const fileContent = fs.readFileSync(fullPath, { encoding: 'utf8' });
        const relativeModulesPath = path.relative(fullPath, moduleDir);

        if (re.test(fileContent)) {
          const newFileContent = fileContent.replace(re, `require("${relativeModulesPath}/$1")`);

          fs.writeFileSync(fullPath, newFileContent);
        }
      });
      addConsoleFlag(libDir);

      spinner.succeed();
      resolve();
    });
  });
};

module.exports = { replaceModules };
