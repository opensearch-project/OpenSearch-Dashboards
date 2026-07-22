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

import Path from 'path';

import { ToolingLog } from '@osd/dev-utils';
import { createPatch } from 'diff';

// turns out Jest can't encode xml diffs in their JUnit reports...
expect.addSnapshotSerializer({
  test: (v) => typeof v === 'string' && (v.includes('<') || v.includes('>')),
  serialize: (v) => v.replace(/</g, '‹').replace(/>/g, '›').replace(/^\s+$/gm, ''),
});

jest.mock('fs', () => {
  const realFs = jest.requireActual('fs');
  return {
    ...realFs,
    writeFile: (...args: any[]) => {
      setTimeout(args[args.length - 1], 0);
    },
  };
});

import { FTR_REPORT, JEST_REPORT, MOCHA_REPORT, CYPRESS_REPORT } from './__fixtures__';
import { parseTestReport } from './test_report';
import { addMessagesToReport } from './add_messages_to_report';

beforeEach(() => {
  jest.resetAllMocks();
});

const log = new ToolingLog();

it('rewrites ftr reports with minimal changes', async () => {
  const xml = await addMessagesToReport({
    report: await parseTestReport(FTR_REPORT),
    messages: [
      {
        name: 'maps app  maps loaded from sample data ecommerce "before all" hook',
        classname:
          'Chrome X-Pack UI Functional Tests.x-pack/test/functional/apps/maps/sample_data·js',
        message: 'foo bar',
      },
    ],
    log,
    reportPath: Path.resolve(__dirname, './__fixtures__/ftr_report.xml'),
  });

  expect(createPatch('ftr.xml', FTR_REPORT, xml, undefined, undefined, { context: 0 }))
    .toMatchInlineSnapshot(`
    Index: ftr.xml
    ===================================================================
    --- ftr.xml
    +++ ftr.xml
    @@ -1,1 +1,1 @@
    -‹?xml version="1.0" encoding="utf-8"?›
    +‹?xml version="1.0" encoding="utf8"?›
    @@ -5,2 +5,5 @@
    -      ‹system-out›
    -        ‹![CDATA[[00:00:00]       │
    +      ‹system-out›Failed Tests Reporter:
    +  - foo bar
    +
    +
    +        [00:00:00]       │
    @@ -10,1 +13,1 @@
    -]]›
    +
    @@ -13,1 +16,1 @@
    -        ‹![CDATA[Error: retry.try timeout: TimeoutError: Waiting for element to be located By(css selector, [data-test-subj~="layerTocActionsPanelToggleButtonRoad_Map_-_Bright"])
    +        Error: retry.try timeout: TimeoutError: Waiting for element to be located By(css selector, [data-test-subj~="layerTocActionsPanelToggleButtonRoad_Map_-_Bright"])
    @@ -18,1 +21,1 @@
    -    at onFailure (/var/lib/jenkins/workspace/elastic+kibana+master/JOB/x-pack-ciGroup7/node/immutable/kibana/test/common/services/retry/retry_for_success.ts:68:13)]]›
    +    at onFailure (/var/lib/jenkins/workspace/elastic+kibana+master/JOB/x-pack-ciGroup7/node/immutable/kibana/test/common/services/retry/retry_for_success.ts:68:13)
    @@ -23,1 +26,1 @@
    -        ‹![CDATA[[00:00:00]       │
    +        [00:00:00]       │
    @@ -26,1 +29,1 @@
    -]]›
    +
    @@ -29,1 +32,1 @@
    -        ‹![CDATA[{ NoSuchSessionError: This driver instance does not have a valid session ID (did you call WebDriver.quit()?) and may no longer be used.
    +        { NoSuchSessionError: This driver instance does not have a valid session ID (did you call WebDriver.quit()?) and may no longer be used.
    @@ -32,1 +35,1 @@
    -    at process._tickCallback (internal/process/next_tick.js:68:7) name: 'NoSuchSessionError', remoteStacktrace: '' }]]›
    +    at process._tickCallback (internal/process/next_tick.js:68:7) name: 'NoSuchSessionError', remoteStacktrace: '' }
    @@ -37,1 +40,1 @@
    -        ‹![CDATA[[00:00:00]       │
    +        [00:00:00]       │
    @@ -40,1 +43,1 @@
    -]]›
    +
    @@ -45,2 +48,2 @@
    -      ‹system-out›‹![CDATA[[00:21:57]         └-: machine learning...]]›‹/system-out›
    -      ‹failure›‹![CDATA[{ NoSuchSessionError: Tried to run command without establishing a connection
    +      ‹system-out›[00:21:57]         └-: machine learning...‹/system-out›
    +      ‹failure›{ NoSuchSessionError: Tried to run command without establishing a connection
    @@ -50,1 +53,1 @@
    -    at process._tickCallback (internal/process/next_tick.js:68:7) name: 'NoSuchSessionError', remoteStacktrace: '' }]]›‹/failure›
    +    at process._tickCallback (internal/process/next_tick.js:68:7) name: 'NoSuchSessionError', remoteStacktrace: '' }‹/failure›
    @@ -53,1 +56,1 @@
    -‹/testsuites›
    +‹/testsuites›
    \\ No newline at end of file

  `);
});

it('rewrites jest reports with minimal changes', async () => {
  const xml = await addMessagesToReport({
    report: await parseTestReport(JEST_REPORT),
    messages: [
      {
        classname: 'X-Pack Jest Tests.x-pack/legacy/plugins/code/server/lsp',
        name: 'launcher can reconnect if process died',
        message: 'foo bar',
      },
    ],
    log,
    reportPath: Path.resolve(__dirname, './__fixtures__/jest_report.xml'),
  });

  expect(createPatch('jest.xml', JEST_REPORT, xml, undefined, undefined, { context: 0 }))
    .toMatchInlineSnapshot(`
    Index: jest.xml
    ===================================================================
    --- jest.xml
    +++ jest.xml
    @@ -1,1 +1,1 @@
    -‹?xml version="1.0" encoding="utf-8"?›
    +‹?xml version="1.0" encoding="utf8"?›
    @@ -7,4 +7,8 @@
    -      ‹failure›
    -        ‹![CDATA[TypeError: Cannot read property '0' of undefined
    -    at Object.‹anonymous›.test (/var/lib/jenkins/workspace/elastic+kibana+master/JOB/x-pack-intake/node/immutable/kibana/x-pack/legacy/plugins/code/server/lsp/abstract_launcher.test.ts:166:10)]]›
    -      ‹/failure›
    +      ‹failure›‹![CDATA[
    +        TypeError: Cannot read property '0' of undefined
    +    at Object.‹anonymous›.test (/var/lib/jenkins/workspace/elastic+kibana+master/JOB/x-pack-intake/node/immutable/kibana/x-pack/legacy/plugins/code/server/lsp/abstract_launcher.test.ts:166:10)
    +      ]]›‹/failure›
    +      ‹system-out›Failed Tests Reporter:
    +  - foo bar
    +
    +‹/system-out›
    @@ -15,1 +19,1 @@
    -‹/testsuites›
    +‹/testsuites›
    \\ No newline at end of file

  `);
});

it('rewrites mocha reports with minimal changes', async () => {
  const xml = await addMessagesToReport({
    report: await parseTestReport(MOCHA_REPORT),
    messages: [
      {
        name: 'code in multiple nodes "before all" hook',
        classname: 'X-Pack Mocha Tests.x-pack/legacy/plugins/code/server/__tests__/multi_node·ts',
        message: 'foo bar',
      },
    ],
    log,
    reportPath: Path.resolve(__dirname, './__fixtures__/mocha_report.xml'),
  });

  expect(createPatch('mocha.xml', MOCHA_REPORT, xml, undefined, undefined, { context: 0 }))
    .toMatchInlineSnapshot(`
    Index: mocha.xml
    ===================================================================
    --- mocha.xml
    +++ mocha.xml
    @@ -1,1 +1,1 @@
    -‹?xml version="1.0" encoding="utf-8"?›
    +‹?xml version="1.0" encoding="utf8"?›
    @@ -5,2 +5,5 @@
    -      ‹system-out›
    -        ‹![CDATA[]]›
    +      ‹system-out›Failed Tests Reporter:
    +  - foo bar
    +
    +
    +
    @@ -8,2 +11,2 @@
    -      ‹failure›
    -        ‹![CDATA[Error: Unable to read artifact info from https://artifacts-api.opensearch.org/v1/versions/8.0.0-SNAPSHOT/builds/latest/projects/elasticsearch: Service Temporarily Unavailable
    +      ‹failure›‹![CDATA[
    +        Error: Unable to read artifact info from https://artifacts-api.opensearch.org/v1/versions/8.0.0-SNAPSHOT/builds/latest/projects/elasticsearch: Service Temporarily Unavailable
    @@ -19,2 +22,2 @@
    -    at process._tickCallback (internal/process/next_tick.js:68:7)]]›
    -      ‹/failure›
    +    at process._tickCallback (internal/process/next_tick.js:68:7)
    +      ]]›‹/failure›
    @@ -24,1 +27,1 @@
    -        ‹![CDATA[]]›
    +
    @@ -27,1 +30,1 @@
    -        ‹![CDATA[TypeError: Cannot read property 'shutdown' of undefined
    +        TypeError: Cannot read property 'shutdown' of undefined
    @@ -29,1 +32,1 @@
    -    at process.topLevelDomainCallback (domain.js:120:23)]]›
    +    at process.topLevelDomainCallback (domain.js:120:23)
    @@ -34,1 +37,1 @@
    -        ‹![CDATA[]]›
    +
    @@ -38,1 +41,1 @@
    -‹/testsuites›
    +‹/testsuites›
    \\ No newline at end of file

  `);
});

it('rewrites cypress reports with minimal changes', async () => {
  const xml = await addMessagesToReport({
    messages: [
      {
        classname: '"after each" hook for "toggles open the timeline"',
        name: 'timeline flyout button "after each" hook for "toggles open the timeline"',
        message: 'Some extra content\n',
      },
    ],
    report: await parseTestReport(CYPRESS_REPORT),
    log,
    reportPath: Path.resolve(__dirname, './__fixtures__/cypress_report.xml'),
  });

  expect(createPatch('cypress.xml', CYPRESS_REPORT, xml, undefined, undefined, { context: 0 }))
    .toMatchInlineSnapshot(`
    Index: cypress.xml
    ===================================================================
    --- cypress.xml
    +++ cypress.xml
    @@ -1,1 +1,1 @@
    -‹?xml version="1.0" encoding="UTF-8"?›
    +‹?xml version="1.0" encoding="utf8"?›
    @@ -3,2 +3,1 @@
    -  ‹testsuite name="Root Suite" timestamp="2020-07-22T15:06:26" tests="0" file="cypress/integration/timeline_flyout_button.spec.ts" failures="0" time="0"›
    -  ‹/testsuite›
    +  ‹testsuite name="Root Suite" timestamp="2020-07-22T15:06:26" tests="0" file="cypress/integration/timeline_flyout_button.spec.ts" failures="0" time="0"/›
    @@ -6,2 +5,1 @@
    -    ‹testcase name="timeline flyout button toggles open the timeline" time="8.099" classname="toggles open the timeline"›
    -    ‹/testcase›
    +    ‹testcase name="timeline flyout button toggles open the timeline" time="8.099" classname="toggles open the timeline"/›
    @@ -9,1 +7,2 @@
    -      ‹failure message="Timed out retrying: \`cy.click()\` could not be issued because this element is currently animating:
    +      ‹failure message="Timed out retrying: \`cy.click()\` could not be issued because this element is currently animating:&#xA;&#xA;\`&lt;button class=&quot;euiButtonEmpty euiButtonEmpty--text&quot; type=&quot;button&quot; data-test-subj=&quot;timeline-new&quot;›...&lt;/button›\`&#xA;&#xA;You can fix this problem by:&#xA;  - Passing \`{force: true}\` which disables all error checking&#xA;  - Passing \`{waitForAnimations: false}\` which disables waiting on animations&#xA;  - Passing \`{animationDistanceThreshold: 20}\` which decreases the sensitivity&#xA;&#xA;https://on.cypress.io/element-is-animating&#xA;&#xA;Because this error occurred during a \`after each\` hook we are skipping the remaining tests in the current suite: \`timeline flyout button\`" type="CypressError"›‹![CDATA[Failed Tests Reporter:
    +  - Some extra content
    @@ -11,1 +9,0 @@
    -\`&lt;button class=&quot;euiButtonEmpty euiButtonEmpty--text&quot; type=&quot;button&quot; data-test-subj=&quot;timeline-new&quot;&gt;...&lt;/button&gt;\`
    @@ -13,4 +11,1 @@
    -You can fix this problem by:
    -  - Passing \`{force: true}\` which disables all error checking
    -  - Passing \`{waitForAnimations: false}\` which disables waiting on animations
    -  - Passing \`{animationDistanceThreshold: 20}\` which decreases the sensitivity
    +CypressError: Timed out retrying: \`cy.click()\` could not be issued because this element is currently animating:
    @@ -18,4 +12,0 @@
    -https://on.cypress.io/element-is-animating
    -
    -Because this error occurred during a \`after each\` hook we are skipping the remaining tests in the current suite: \`timeline flyout button\`" type="CypressError"›‹![CDATA[CypressError: Timed out retrying: \`cy.click()\` could not be issued because this element is currently animating:
    -
    @@ -50,1 +41,1 @@
    -‹/testsuites›
    +‹/testsuites›
    \\ No newline at end of file

  `);
});
