/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
export { monaco } from './monaco';
import 'monaco-editor-next/esm/vs/language/json/monaco.contribution';
import { registerWorker } from '@osd/monaco';
// @ts-ignore
import jsonWorkerSrc from '!!raw-loader!../target/public/json.editor.worker.js';

registerWorker('json', jsonWorkerSrc);
