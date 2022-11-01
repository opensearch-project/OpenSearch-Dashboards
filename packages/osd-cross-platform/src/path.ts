/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { execSync } from 'child_process';
import { basename, normalize, resolve } from 'path';
import {
  realpathSync as nativeRealpathSync,
  openSync,
  closeSync,
  existsSync,
  unlinkSync,
} from 'fs';

export const NAMESPACE_PREFIX = process.platform === 'win32' ? '\\\\?\\' : '';

/**
 * Get a standardized reference to a path
 * @param {string} path - the path to standardize
 * @param {boolean} [usePosix=true] - produce a posix reference
 * @param {boolean} [escapedBackslashes=true] - on Windows, double-backslash the reference
 * @param {boolean} [returnUNC=false] - produce an extended reference
 */
export const standardize = (
  path: string,
  usePosix: boolean = true,
  escapedBackslashes: boolean = true,
  returnUNC: boolean = false
) => {
  // Force os-dependant separators
  const normal = normalize(path);

  // Filter out in-browser executions as well as non-windows ones
  if (process?.platform !== 'win32') return normal;

  if (usePosix) return normal.replace(/\\/g, '/');
  else if (escapedBackslashes) return normal.replace(/\\/g, '\\\\');
  else if (returnUNC) return '\\\\?\\' + normal;
  return normal;
};

/**
 * Windows-only function that uses PowerShell to calculate the full path
 * @param {string} path
 * @private
 */
const getFullPathSync = (path: string) => {
  if (process.platform !== 'win32') return path;

  try {
    const fullName = execSync(`powershell "(Get-Item -LiteralPath '${path}').FullName"`, {
      encoding: 'utf8',
    })?.trim?.();

    // Make sure we got something back
    if (fullName?.length > 2) return fullName;
  } catch (ex) {
    // Do nothing
  }

  return path;
};

/**
 * Windows-only function that uses PowerShell and Com Object to calculate the 8.3 path
 * @param {string} path
 * @private
 */
const getShortPathSync = (path: string) => {
  if (process.platform !== 'win32') return path;

  try {
    const shortPath = execSync(
      `powershell "$FSO = New-Object -ComObject Scripting.FileSystemObject; $O = (Get-Item -LiteralPath '${path}'); if ($O.PSIsContainer) { $FSO.GetFolder($O.FullName).ShortPath } else { $FSO.GetFile($O.FullName).ShortPath }"`,
      {
        encoding: 'utf8',
      }
    )?.trim?.();

    // Make sure we got something back
    if (shortPath?.length > 2) return shortPath;
  } catch (ex) {
    // Do nothing
  }

  return path;
};

/**
 * Checks if Windows 8.3 short names are supported on the volume of the given path
 * @param {string} [path='.'] - the path to examine
 */
export const shortNamesSupportedSync = (path: string = '.') => {
  if (process.platform !== 'win32') return false;

  const testFileName = '.___osd-cross-platform-test.file';
  const file = resolve(path, testFileName);

  // Create a test file if it doesn't exist
  if (!existsSync(file)) closeSync(openSync(file, 'w'));

  // If the returned value's basename is not the same as the requested file name, it must be a short name
  const foundShortName = basename(getShortPathSync(file)) !== testFileName;

  // Cleanup
  unlinkSync(file);

  return foundShortName;
};

/**
 * @borrows shortNamesSupportedSync
 */
export const shortNameSupportedSync = shortNamesSupportedSync;

/**
 * Get the full pathname
 * @param {string} path - the path to resolve
 */
export const resolveToFullPathSync = (path: string) => getFullPathSync(resolve(path));

/**
 * @borrows resolveToFullPathSync
 */
export const resolveToFullNameSync = resolveToFullPathSync;

/**
 * Get the short pathname
 * @param {string} path - the path to resolve
 */
export const resolveToShortPathSync = (path: string) => getShortPathSync(resolve(path));

/**
 * @borrows resolveToShortPathSync
 */
export const resolveToShortNameSync = resolveToShortPathSync;

/**
 * Get the canonical pathname
 * @param {string} path - the path to resolve
 */
export const realPathSync = (path: string) => getFullPathSync(nativeRealpathSync(path, 'utf8'));

/**
 * @borrows realPathSync
 */
export const realpathSync = realPathSync;

/**
 * Get the canonical pathname
 * @param {string} path - the path to resolve
 */
export const realShortPathSync = (path: string) =>
  getShortPathSync(nativeRealpathSync(path, 'utf8'));

/**
 * @borrows realShortPathSync
 */
export const realshortpathSync = realShortPathSync;
