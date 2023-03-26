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

const semver = require('semver');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const allPossibleCombinations = [
  'a patch downgrade',
  'the exact version',
  'a patch upgrade',

  'a minor upgrade with lower patch',
  'a minor upgrade with same patch',
  'a minor upgrade with higher patch',

  'a minor downgrade with lower patch',
  'a minor downgrade with same patch',
  'a minor downgrade with higher patch',

  'a major upgrade with same minor and lower patch',
  'a major upgrade with same minor and same patch',
  'a major upgrade with same minor and higher patch',

  'a major downgrade with same minor and lower patch',
  'a major downgrade with same minor and same patch',
  'a major downgrade with same minor and higher patch',

  'a major upgrade with lower minor and lower patch',
  'a major upgrade with lower minor and same patch',
  'a major upgrade with lower minor and higher patch',

  'a major downgrade with lower minor and lower patch',
  'a major downgrade with lower minor and same patch',
  'a major downgrade with lower minor and higher patch',

  'a major upgrade with higher minor and lower patch',
  'a major upgrade with higher minor and same patch',
  'a major upgrade with higher minor and higher patch',

  'a major downgrade with higher minor and lower patch',
  'a major downgrade with higher minor and same patch',
  'a major downgrade with higher minor and higher patch',
];

const allPossibleOperators = [
  { title: 'no operator', operator: '' },
  { title: 'the equals operator', operator: '=' },
  { title: 'the greater-than operator', operator: '>' },
  { title: 'the greater-than-or-equals operator', operator: '>=' },
  { title: 'the caret operator', operator: '^' },
  { title: 'the tilde operator', operator: '~' },
];

// Regex pattern to parse test titles which gets used to create new versions
const testTitleMatcher = /(?:(major|minor|patch)\s+(upgrade|downgrade)|(higher|lower)\s+(major|minor|patch))/g;
const testTitleChanges = {
  upgrade: 1,
  downgrade: -1,
  higher: 1,
  lower: -1,
};

const titleChangesCache = new Map();

// Parse the test title and generate a new version
const getUpdatedVersion = (testedVersion, title) => {
  let matches;
  let majorChange = 0;
  let minorChange = 0;
  let patchChange = 0;

  if (titleChangesCache.has(title)) {
    const cache = titleChangesCache.get(title);
    majorChange = cache.majorChange;
    minorChange = cache.minorChange;
    patchChange = cache.patchChange;
  } else {
    while ((matches = testTitleMatcher.exec(title)) !== null) {
      const change = testTitleChanges[matches[2]] || testTitleChanges[matches[3]];
      if (matches[1] === 'major' || matches[4] === 'major') majorChange = change;
      else if (matches[1] === 'minor' || matches[4] === 'minor') minorChange = change;
      else if (matches[1] === 'patch' || matches[4] === 'patch') patchChange = change;
    }

    titleChangesCache.set(title, { majorChange, minorChange, patchChange });
  }

  return testedVersion.change(majorChange, minorChange, patchChange);
};

const getMockedPackageJson = (requiredRange) => {
  switch (requiredRange) {
    case 'BLANK':
      return `{ engines: { node: '' }}`;
    case 'NO_NODE':
      return `{ engines: { }}`;
    case 'NO_ENGINES':
      return `{}`;
    default:
      return `{ engines: { node: '${requiredRange}' }}`;
  }
};

const checkNodeVersionValidation = async (nodeVersion, requiredRange) => {
  const mockedProcessVersion = `Object.defineProperty(process, 'version', { value: '${
    nodeVersion ? 'v' + nodeVersion : ''
  }', writable: true });`;
  // Node + Windows doesn't like line-feeds
  const mockedRequire =
    `const Module = require('module');` +
    `const req = Module.prototype.require;` +
    `Module.prototype.require = name =>` +
    `name === '../../package.json' ?` +
    getMockedPackageJson(requiredRange) +
    `: req(name);`;
  try {
    /* ToDo: Implement changes so these tests can contribute to the code coverage report
     * `jest --coverage` is not capable of handling child processes: https://github.com/facebook/jest/issues/5274
     *
     * The workaround is to do
     *   1. `nyc node scripts/jest`
     *      This cleans the cached `.nyc_output` and correctly instruments subprocesses
     *   2. `nyc report --reporter=lcov --reporter=text-summary --report-dir target/opensearch-dashboards-coverage/jest`
     *      This generates the lcov report and shows a summary
     *   3. Clean up `.nyc_output`
     *
     *   Note: src/dev/jest/config.js should be checked for any other config that we would like to pass to nyc
     */
    await exec(
      `"${process.execPath}" -e "${mockedProcessVersion}${mockedRequire}require('./node_version_validator.js')"`,
      { cwd: __dirname }
    );
  } catch (ex) {
    if (ex.stderr?.indexOf('OpenSearch Dashboards') > -1)
      return {
        error: ex.code,
        stderr: ex.stderr,
      };

    throw ex;
  }

  return {
    error: 0,
  };
};

// Create an appropriate test based on how semver feels about the version and range
const defineTest = (title, testedVersion, requiredRange) => {
  const version = getUpdatedVersion(testedVersion, title);

  return semver.satisfies(version, requiredRange)
    ? it(`${requiredRange}, should accept v${version}, ${title}`, async () => {
        const { error, stderr } = await checkNodeVersionValidation(version, requiredRange);
        expect(error).toEqual(0); // The exit code indicating an acceptable version
        expect(stderr).toStrictEqual(undefined);
      })
    : it(`${requiredRange}, should not accept v${version}, ${title}`, async () => {
        const { error, stderr } = await checkNodeVersionValidation(version, requiredRange);
        expect(error).toEqual(21); // The exit code indicating an unacceptable version
        expect(stderr.trim()).toMatchSnapshot();
      });
};

const describeSuites = (testsToRun, testedVersion, comparatorVersion) => {
  describe.each(allPossibleOperators)('$title', ({ operator }) => {
    testsToRun.forEach((title) =>
      defineTest(title, testedVersion, `${operator}${comparatorVersion}`)
    );
  });
};

const parseVersion = (version) => {
  const parts = version?.match(/^\s*v?\s*(\d+)\.(\d+)\.(\d+)(\D.*)?$/) || null;
  if (parts === null) throw `<${version}> is not a parsable version.`;
  const numericParts = {
    major: parseInt(parts[1], 10) || 0,
    minor: parseInt(parts[2], 10) || 0,
    patch: parseInt(parts[3], 10) || 0,
  };

  // prettier-ignore
  const change = (majorChange = 0, minorChange = 0, patchChange = 0) =>
    (numericParts.major + majorChange) +
    '.' +
    (numericParts.minor + minorChange) +
    '.' +
    (numericParts.patch + patchChange);

  return {
    get exact() {
      return change();
    },
    change,
  };
};

describe('Node.js version validation', () => {
  describe('non-new Node.js version using a comparator with a complete version, and', () => {
    const comparatorVersion = '4.55.666';
    const testedVersion = parseVersion('4.55.666');
    const testsToRun = allPossibleCombinations;

    describeSuites(testsToRun, testedVersion, comparatorVersion);
  });

  describe('non-new Node.js version using a comparator with a version missing its patch, and', () => {
    const comparatorVersion = '4.55';
    const testedVersion = parseVersion('4.55.666');
    const testsToRun = allPossibleCombinations;

    describeSuites(testsToRun, testedVersion, comparatorVersion);
  });

  describe('new minor Node.js version using a comparator with a version missing its patch, and', () => {
    const comparatorVersion = '4.55';
    const testedVersion = parseVersion('4.55.0');
    // The tested version has zero for its patch value so exclude tests that lower it
    const testsToRun = allPossibleCombinations.filter(
      (title) => !/(patch downgrade|lower patch)/.test(title)
    );

    describeSuites(testsToRun, testedVersion, comparatorVersion);
  });

  describe('new major Node.js version using a comparator with a version missing its patch and minor, and', () => {
    const comparatorVersion = '4';
    const testedVersion = parseVersion('4.0.0');
    // The tested version has zeros for patch and minor values so exclude tests that lower them
    const testsToRun = allPossibleCombinations.filter(
      (title) => !/((patch|minor) downgrade|lower (patch|minor))/.test(title)
    );

    describeSuites(testsToRun, testedVersion, comparatorVersion);
  });

  it('fails if package.json is missing engines', async () => {
    const { error, stderr } = await checkNodeVersionValidation('4.55.666', 'NO_ENGINES');
    expect(error).toEqual(22); // The exit code indicating missing engines.node range
    expect(stderr.trim()).toMatchSnapshot();
  });

  it('fails if package.json is missing engines.node', async () => {
    const { error, stderr } = await checkNodeVersionValidation('4.55.666', 'NO_NODE');
    expect(error).toEqual(22); // The exit code indicating missing engines.node range
    expect(stderr.trim()).toMatchSnapshot();
  });

  it('fails if package.json has a blank engines.node', async () => {
    const { error, stderr } = await checkNodeVersionValidation('4.55.666', 'BLANK');
    expect(error).toEqual(22); // The exit code indicating missing engines.node range
    expect(stderr.trim()).toMatchSnapshot();
  });

  it('fails if package.json has an invalid engines.node', async () => {
    const { error, stderr } = await checkNodeVersionValidation('4.55.666', 'INVALID');
    expect(error).toEqual(23); // The exit code indicating an unacceptable engines.node range
    expect(stderr.trim()).toMatchSnapshot();
  });

  it('fails if package.json has a 0.x.x engines.node', async () => {
    const { error, stderr } = await checkNodeVersionValidation('4.55.666', '0.11.222');
    expect(error).toEqual(24); // The exit code indicating an unacceptable engines.node range
    expect(stderr.trim()).toMatchSnapshot();
  });

  it('fails if process.version is not reported', async () => {
    const { error, stderr } = await checkNodeVersionValidation('', '4.55.666');
    expect(error).toEqual(25); // The exit code indicating an unacceptable process.version
    expect(stderr.trim()).toMatchSnapshot();
  });

  it('fails if process.version reports an invalid value', async () => {
    const { error, stderr } = await checkNodeVersionValidation('INVALID', '4.55.666');
    expect(error).toEqual(26); // The exit code indicating an unacceptable process.version
    expect(stderr.trim()).toMatchSnapshot();
  });
});
