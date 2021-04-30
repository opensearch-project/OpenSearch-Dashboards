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

const compileImportTemplate = require('./import_template');
const compileRouteTemplate = require('./route_template');

function indexTemplate() {
  return `
import '../../src/theme_light.scss';
import '../../storybook/style.scss';
import React from 'react';
import ReactDOM from 'react-dom';
import { VRTPage } from './vrt_page';
import { appendIconComponentCache } from '@elastic/eui/es/components/icon/icon';
appendIconComponentCache({
  arrowUp: require('@elastic/eui/es/components/icon/assets/arrow_up').icon,
  arrowLeft: require('@elastic/eui/es/components/icon/assets/arrow_left').icon,
  arrowDown: require('@elastic/eui/es/components/icon/assets/arrow_down').icon,
  arrowRight: require('@elastic/eui/es/components/icon/assets/arrow_right').icon,
  iInCircle: require('@elastic/eui/es/components/icon/assets/iInCircle').icon,
  tokenKey: require('@elastic/eui/es/components/icon/assets/tokens/tokenKey').icon,
  filter: require('@elastic/eui/es/components/icon/assets/filter').icon,
  starFilled: require('@elastic/eui/es/components/icon/assets/star_filled').icon,
  pencil: require('@elastic/eui/es/components/icon/assets/pencil').icon,
  visualizeApp: require('@elastic/eui/es/components/icon/assets/app_visualize').icon,
});
ReactDOM.render(<VRTPage />, document.getElementById('story-root') as HTMLElement);

`.trim();
}

function pageTemplate(imports, routes) {
  return `
import React, { Suspense } from 'react';

${imports.join('\n')}

export function VRTPage() {
  const path = new URL(window.location.toString()).searchParams.get('path');
  if(!path) {
    return <h1>missing url path</h1>;
  }
  return (
    <Suspense fallback={<div>Loading...</div>}>
     ${routes.join('\n     ')}
    </Suspense>
  );
}

`.trim();
}

function compileVRTPage(examples) {
  const flatExamples = examples.reduce((acc, { exampleFiles }) => {
    acc.push(...exampleFiles);
    return acc;
  }, []);
  const { imports, routes } = flatExamples.reduce(
    (acc, { filePath, url }, index) => {
      acc.imports.push(compileImportTemplate(index, filePath));
      acc.routes.push(compileRouteTemplate(index, url));
      return acc;
    },
    { imports: [], routes: [] },
  );

  fs.writeFileSync(path.join('integration', 'tmp', 'vrt_page.tsx'), pageTemplate(imports, routes));
  fs.writeFileSync(path.join('integration', 'tmp', 'index.tsx'), indexTemplate());
}

compileVRTPage(require('../../tmp/examples.json'));
