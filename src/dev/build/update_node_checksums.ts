/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import axios from 'axios';
import execa from 'execa';
import semver from 'semver';
import { createFailError, run } from '@osd/dev-utils';

import { ALL_PLATFORMS } from './lib/platform';
import { getNodeVersionDownloadInfo } from './tasks/nodejs/node_download_info';
import { NODE_CHECKSUMS_PATH } from './tasks/nodejs/node_shasums';

const REPO_ROOT = resolve(__dirname, '../../..');
// Fetched from GitHub rather than nodejs.org, so a tampered nodejs.org cannot also vouch for itself
const RELEASE_KEYRING_URL =
  'https://raw.githubusercontent.com/nodejs/release-keys/main/gpg-only-active-keys/pubring.kbx';

/** The archive names the build downloads for `version`, one per target platform. */
export async function getDownloadNames(version: string) {
  return Promise.all(
    ALL_PLATFORMS.map(
      async (platform) =>
        (
          await getNodeVersionDownloadInfo(
            version,
            platform.getNodeArch(),
            platform.isWindows(),
            REPO_ROOT
          )
        ).downloadName
    )
  );
}

/** Picks the build's archives out of a verified SHASUMS256.txt. */
export async function pickChecksums(shasums: string, version: string) {
  const all = new Map(
    shasums
      .split('\n')
      .map((line) => line.trim().split(/\s+/))
      .filter((parts) => parts.length === 2)
      .map(([sha, name]) => [name, sha] as [string, string])
  );

  const picked: Record<string, string> = {};
  for (const name of await getDownloadNames(version)) {
    const sha = all.get(name);
    if (!sha || !/^[a-f0-9]{64}$/.test(sha)) {
      throw new Error(`SHASUMS256.txt for v${version} has no sha256 for ${name}`);
    }
    picked[name] = sha;
  }
  return picked;
}

async function download(url: string) {
  const { data } = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(data);
}

/** Returns the content of a clearsigned file only if a Node.js release key signed it. */
async function verifyClearsigned(signed: Buffer, keyring: Buffer, workDir: string) {
  const keyringPath = join(workDir, 'pubring.kbx');
  const signedPath = join(workDir, 'SHASUMS256.txt.asc');
  const outputPath = join(workDir, 'SHASUMS256.txt');
  await writeFile(keyringPath, keyring);
  await writeFile(signedPath, signed);

  let status: string;
  try {
    ({ stdout: status } = await execa('gpg', [
      '--batch',
      '--no-default-keyring',
      '--keyring',
      keyringPath,
      '--homedir',
      workDir,
      '--status-fd',
      '1',
      '--output',
      outputPath,
      '--decrypt',
      signedPath,
    ]));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw createFailError('gpg is required to verify the Node.js release signature');
    }
    throw createFailError(`The SHASUMS256.txt signature did not verify:\n${error}`);
  }

  if (!/^\[GNUPG:\] VALIDSIG /m.test(status)) {
    throw createFailError(`gpg did not report a valid signature:\n${status}`);
  }
  return (await readFile(outputPath)).toString('utf8');
}

export function updateNodeChecksumsCli() {
  run(
    async ({ flags, log }) => {
      const version = semver.valid(String(flags._[0] ?? ''));
      if (!version) {
        throw createFailError('Pass the Node.js version to bundle, e.g. 26.13.1', {
          showHelp: true,
        });
      }

      const pkg = JSON.parse(await readFile(join(REPO_ROOT, 'package.json'), 'utf8'));
      if (!semver.satisfies(version, pkg.engines.node)) {
        throw createFailError(
          `${version} does not satisfy engines.node "${pkg.engines.node}"; update package.json and .nvmrc first`
        );
      }

      const workDir = await mkdtemp(join(tmpdir(), 'osd-node-checksums-'));
      try {
        log.info('Downloading the Node.js release keyring from', RELEASE_KEYRING_URL);
        const keyring = await download(RELEASE_KEYRING_URL);
        const shasumsUrl = `https://nodejs.org/dist/v${version}/SHASUMS256.txt.asc`;
        log.info('Downloading', shasumsUrl);
        const signed = await download(shasumsUrl);

        const shasums = await verifyClearsigned(signed, keyring, workDir);
        log.success('SHASUMS256.txt is signed by a Node.js release key');

        const sha256 = await pickChecksums(shasums, version);
        await writeFile(NODE_CHECKSUMS_PATH, `${JSON.stringify({ version, sha256 }, null, 2)}\n`);
        await writeFile(join(REPO_ROOT, '.node-version'), `${version}\n`);

        log.success(`Pinned Node.js ${version}; commit .node-version and node_checksums.json`);
      } finally {
        await rm(workDir, { recursive: true, force: true });
      }
    },
    {
      description: 'Pin the Node.js version bundled into release builds and record its checksums',
      usage: 'node scripts/update_node_checksums <version>',
    }
  );
}
