/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
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
