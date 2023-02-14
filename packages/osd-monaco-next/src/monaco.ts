/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import * as monaco from 'monaco-editor-next/esm/vs/editor/editor.api';

import 'monaco-editor-next/esm/vs/base/common/worker/simpleWorker';
import 'monaco-editor-next/esm/vs/base/worker/defaultWorkerFactory';

import 'monaco-editor-next/esm/vs/editor/browser/controller/coreCommands.js';
import 'monaco-editor-next/esm/vs/editor/browser/widget/codeEditorWidget.js';

import 'monaco-editor-next/esm/vs/editor/contrib/wordOperations/wordOperations.js'; // Needed for word-wise char navigation

import 'monaco-editor-next/esm/vs/editor/contrib/suggest/suggestController.js'; // Needed for suggestions
import 'monaco-editor-next/esm/vs/editor/contrib/hover/hover.js'; // Needed for hover
import 'monaco-editor-next/esm/vs/editor/contrib/parameterHints/parameterHints.js'; // Needed for signature

export { monaco };
