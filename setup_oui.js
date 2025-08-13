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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// setup-oui.js
// Usage: node setup-oui.js "C:/Users/Usuario/Documents/.work/personal/oui"

const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.error('Usage: node setup-oui.js <path-to-oui>');
  process.exit(1);
}

const ouiPath = process.argv[2].replace(/\\/g, '/'); // converte \ para /
console.log(`Updating @elastic/eui to use local OUI at: ${ouiPath}`);

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file === 'package.json') {
      updatePackageJson(fullPath);
    }
  });
}

function updatePackageJson(filePath) {
  const data = fs.readFileSync(filePath, 'utf8');
  let pkg;
  try {
    pkg = JSON.parse(data);
  } catch (err) {
    console.error(`Skipping invalid JSON: ${filePath}`);
    return;
  }

  if (pkg.dependencies && pkg.dependencies['@elastic/eui']) {
    pkg.dependencies['@elastic/eui'] = `file:${ouiPath}`;
    fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2));
    console.log(`Updated: ${filePath}`);
  }
}

walk(process.cwd());
console.log('All package.json files updated successfully.');
