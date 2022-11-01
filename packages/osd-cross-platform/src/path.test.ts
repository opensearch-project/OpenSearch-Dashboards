/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';
import fs from 'fs';
import { access, rmdir, mkdir, writeFile, symlink } from 'fs/promises';

import {
  resolveToFullNameSync,
  resolveToFullPathSync,
  resolveToShortNameSync,
  resolveToShortPathSync,
  shortNamesSupportedSync,
  realPathSync,
  realShortPathSync,
  standardize,
} from './path';

const tmpTestFolder = './__test_artifacts__';
const longFolderName = '.long-folder-name';
const longFileName = '.long-file-name.txt';
const longSymlinkName = '.sym.link';
const shortFolderName = 'LONG-F~1';
const shortFileName = 'LONG-F~1.TXT';
const dummyWindowsPath = 'C:\\a\\b\\c';
const dummyWindowsPOSIXPath = 'C:/a/b/c';
const dummyPOSIXPath = '/a/b/c';

const onWindows = process.platform === 'win32' ? describe : xdescribe;
const onWindowsWithShortNames = shortNamesSupportedSync() ? describe : xdescribe;

// Save the real process.platform
const realPlatform = Object.getOwnPropertyDescriptor(process, 'platform')!;

describe('Cross Platform', () => {
  describe('path', () => {
    onWindows('on Windows', () => {
      onWindowsWithShortNames('when 8.3 is supported', () => {
        beforeAll(async () => {
          // Cleanup
          try {
            // If leftover artifacts were found, get rid of them
            await access(tmpTestFolder);
            await rmdir(tmpTestFolder, { recursive: true });
          } catch (ex) {
            // Do nothing; if `rmdir` failed, let the `mkdir` below throw the error
          }

          await mkdir(tmpTestFolder);
          await mkdir(path.resolve(tmpTestFolder, longFolderName));
          await writeFile(path.resolve(tmpTestFolder, longFolderName, longFileName), '');
          await symlink(
            path.resolve(tmpTestFolder, longFolderName),
            path.resolve(tmpTestFolder, longSymlinkName),
            'junction'
          );
        });

        afterAll(async () => {
          try {
            await rmdir(tmpTestFolder, { recursive: true });
          } catch (ex) {
            // Do nothing
          }
        });

        it('can synchronously extract full name of a folder', () => {
          const name = path.basename(
            resolveToFullPathSync(path.resolve(tmpTestFolder, shortFolderName))
          );
          expect(name).toBe(longFolderName);
        });

        it('can synchronously extract full name of a file', () => {
          const name = path.basename(
            resolveToFullNameSync(path.resolve(tmpTestFolder, shortFolderName, shortFileName))
          );
          expect(name).toBe(longFileName);
        });

        it('can synchronously extract short name of a folder', () => {
          const name = path.basename(
            resolveToShortPathSync(path.resolve(tmpTestFolder, longFolderName))
          );
          expect(name).toBe(shortFolderName);
        });

        it('can synchronously extract short name of a file', () => {
          const name = path.basename(
            resolveToShortNameSync(path.resolve(tmpTestFolder, longFolderName, longFileName))
          );
          expect(name).toBe(shortFileName);
        });

        it('can synchronously extract full name of a symbolic link', () => {
          const name = path.basename(realPathSync(path.resolve(tmpTestFolder, longSymlinkName)));
          expect(name).toBe(longFolderName);
        });

        it('can synchronously extract short name of a symbolic link', () => {
          const name = path.basename(
            realShortPathSync(path.resolve(tmpTestFolder, longSymlinkName))
          );
          expect(name).toBe(shortFolderName);
        });
      });
    });

    describe('on platforms other than Windows', () => {
      let mockPathNormalize: jest.SpyInstance<string, [p: string]>;
      let mockPathResolve: jest.SpyInstance<string, string[]>;
      let mockFSRealPathSync: jest.SpyInstance<string>;

      beforeAll(() => {
        Object.defineProperty(process, 'platform', {
          ...Object.getOwnPropertyDescriptor(process, 'property'),
          value: 'linux',
        });

        mockPathNormalize = jest.spyOn(path, 'normalize').mockReturnValue(dummyPOSIXPath);
        mockPathResolve = jest.spyOn(path, 'resolve').mockReturnValue(dummyPOSIXPath);
        mockFSRealPathSync = jest
          .spyOn(fs, 'realpathSync')
          .mockReturnValue(dummyPOSIXPath) as jest.SpyInstance<string>;
      });

      afterAll(() => {
        // Restore the real property value after each test
        Object.defineProperty(process, 'platform', realPlatform);
        mockPathNormalize.mockRestore();
        mockPathResolve.mockRestore();
        mockFSRealPathSync.mockRestore();
      });

      it('all short and full name methods return just the normalized paths', () => {
        expect(shortNamesSupportedSync()).toBe(false);
        expect(resolveToFullPathSync(dummyPOSIXPath)).toBe(dummyPOSIXPath);
        expect(resolveToShortPathSync(dummyPOSIXPath)).toBe(dummyPOSIXPath);
      });
    });

    describe('standardize', () => {
      describe('on Windows', () => {
        let mockPathNormalize: jest.SpyInstance<string, [p: string]>;

        beforeAll(() => {
          Object.defineProperty(process, 'platform', {
            ...Object.getOwnPropertyDescriptor(process, 'property'),
            value: 'win32',
          });

          mockPathNormalize = jest.spyOn(path, 'normalize').mockReturnValue(dummyWindowsPath);
        });

        afterAll(() => {
          // Restore the real property value after each test
          Object.defineProperty(process, 'platform', realPlatform);
          mockPathNormalize.mockRestore();
        });

        it('produces a path in native format', () => {
          expect(standardize(dummyWindowsPath, false, false)).toMatchSnapshot();
        });

        it('produces a path in native format even for POSIX input', () => {
          expect(standardize(dummyWindowsPOSIXPath, false, false)).toMatchSnapshot();
        });

        it('produces a path in native format with escaped backslashes', () => {
          expect(standardize(dummyWindowsPath, false, true)).toMatchSnapshot();
        });

        it('produces a path in POSIX format', () => {
          expect(standardize(dummyWindowsPath)).toMatchSnapshot();
        });
      });

      describe('on POSIX-compatible platforms', () => {
        let mockPathNormalize: jest.SpyInstance<string, [p: string]>;

        beforeAll(() => {
          Object.defineProperty(process, 'platform', {
            ...Object.getOwnPropertyDescriptor(process, 'property'),
            value: 'linux',
          });

          mockPathNormalize = jest.spyOn(path, 'normalize').mockReturnValue(dummyPOSIXPath);
        });

        afterAll(() => {
          // Restore the real property value after each test
          Object.defineProperty(process, 'platform', realPlatform);
          mockPathNormalize.mockRestore();
        });

        it('produces a path in POSIX format', () => {
          expect(standardize(dummyPOSIXPath)).toMatchSnapshot();
        });

        it('ignores additional parameters', () => {
          expect(standardize(dummyPOSIXPath, false, true)).toMatchSnapshot();
        });
      });
    });
  });
});
