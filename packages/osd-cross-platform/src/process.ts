/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { execSync } from 'child_process';

let workingDir = process.cwd();

if (process.platform === 'win32') {
  try {
    const pathFullName = execSync('powershell "(Get-Item -LiteralPath $pwd).FullName"', {
      cwd: workingDir,
      encoding: 'utf8',
    })?.trim?.();
    if (pathFullName?.length > 2) workingDir = pathFullName;
  } catch (ex) {
    // Do nothing
  }
}

export const PROCESS_WORKING_DIR = workingDir;
