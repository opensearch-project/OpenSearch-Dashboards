/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerWorker } from '../worker_store';
// @ts-ignore
import jsonWorkerSrc from '!!raw-loader!../../target/public/json.editor.worker.js';

registerWorker('json', jsonWorkerSrc);
