/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolveToFullPathSync, standardize } from './path';

/**
 * The full pathname of the working directory of the process
 * @constant
 * @type {string}
 */
export const PROCESS_WORKING_DIR: string = resolveToFullPathSync(process.cwd());

/**
 * The full pathname of the working directory of the process, in POSIX format
 * @constant
 * @type {string}
 */
export const PROCESS_POSIX_WORKING_DIR: string = standardize(PROCESS_WORKING_DIR);
