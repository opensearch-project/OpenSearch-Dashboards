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

/* eslint-disable @osd/eslint/module_migration */

// Import the monaco-editor package directly
import * as monaco from 'monaco-editor/editor/editor.api.js';

// Import worker-related modules
import 'monaco-editor/base/common/worker/webWorker.js';
import 'monaco-editor/editor/browser/services/editorWorkerService.js';

// Import core editor functionality
import 'monaco-editor/editor/browser/coreCommands.js';
import 'monaco-editor/editor/browser/widget/codeEditor/codeEditorWidget.js';

// Import editor features
import 'monaco-editor/editor/contrib/wordOperations/browser/wordOperations.js'; // For word-wise char navigation
import 'monaco-editor/editor/contrib/suggest/browser/suggestController.js'; // For autocomplete
import 'monaco-editor/editor/contrib/hover/browser/hoverContribution.js'; // For hover
import 'monaco-editor/editor/contrib/parameterHints/browser/parameterHints.js'; // For parameter hints
import 'monaco-editor/editor/contrib/format/browser/formatActions.js'; // For document formatting
import 'monaco-editor/editor/contrib/comment/browser/comment.js'; // For comment/uncomment support
import 'monaco-editor/editor/contrib/codeAction/browser/codeActionContributions.js'; // For quick-fix lightbulb + editor.action.quickFix

export { monaco };
