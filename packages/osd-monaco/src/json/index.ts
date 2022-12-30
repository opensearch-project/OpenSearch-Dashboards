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

/**
 * monaco-editor under v0.20.0 has the bug that use the global monaco uncorrectly in ESM mode. https://github.com/microsoft/monaco-editor/issues/1974
 * copy the language implement and import by our self.
 * */
import { monaco } from '../monaco';
// @ts-ignore
import * as mode from 'monaco-editor/esm/vs/language/json/jsonMode.js'; // eslint-disable-line

const Emitter = monaco.Emitter;
class LanguageServiceDefaultsImpl {
  _onDidChange: monaco.Emitter<any>;
  _languageId: string;
  _diagnosticsOptions!: monaco.languages.json.DiagnosticsOptions;
  constructor(languageId: string, diagnosticsOptions: monaco.languages.json.DiagnosticsOptions) {
    this._onDidChange = new Emitter();
    this._languageId = languageId;
    this.setDiagnosticsOptions(diagnosticsOptions);
  }
  public get languageId() {
    return this._languageId;
  }
  public get onDidChange() {
    return this._onDidChange.event;
  }
  public get diagnosticsOptions() {
    return this._diagnosticsOptions;
  }
  setDiagnosticsOptions(options: monaco.languages.json.DiagnosticsOptions) {
    this._diagnosticsOptions = options || Object.create(null);
    this._onDidChange.fire(this);
  }
}
export { LanguageServiceDefaultsImpl };
const diagnosticDefault = {
  validate: true,
  allowComments: true,
  schemas: [],
  enableSchemaRequest: false,
};
const jsonDefaults = new LanguageServiceDefaultsImpl('json', diagnosticDefault);
function createAPI() {
  return {
    jsonDefaults,
  };
}
monaco.languages.json = createAPI();
monaco.languages.register({
  id: 'json',
  extensions: ['.json', '.bowerrc', '.jshintrc', '.jscsrc', '.eslintrc', '.babelrc'],
  aliases: ['JSON', 'json'],
  mimetypes: ['application/json'],
});
monaco.languages.onLanguage('json', function () {
  mode.setupMode(jsonDefaults);
});
