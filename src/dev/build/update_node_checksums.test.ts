/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDownloadNames, pickChecksums } from './update_node_checksums';

const sha = (n: number) => String(n).repeat(64).slice(0, 64);

const SHASUMS = `${sha(1)}  node-v99.99.99-aix-ppc64.tar.gz
${sha(2)}  node-v99.99.99-darwin-arm64.tar.gz
${sha(3)}  node-v99.99.99-darwin-arm64.tar.xz
${sha(4)}  node-v99.99.99-darwin-x64.tar.gz
${sha(5)}  node-v99.99.99-linux-arm64.tar.gz
${sha(6)}  node-v99.99.99-linux-x64.tar.gz
${sha(7)}  node-v99.99.99-linux-x64.tar.xz
${sha(8)}  node-v99.99.99-win-x64.7z
${sha(9)}  node-v99.99.99-win-x64.zip
${sha(1)}  win-x64/node.exe
`;

describe('getDownloadNames', () => {
  it('names the archive the build downloads for each platform', async () => {
    expect(await getDownloadNames('99.99.99')).toEqual([
      'node-v99.99.99-linux-x64.tar.gz',
      'node-v99.99.99-linux-arm64.tar.gz',
      'node-v99.99.99-darwin-x64.tar.gz',
      'node-v99.99.99-darwin-arm64.tar.gz',
      'node-v99.99.99-win-x64.zip',
    ]);
  });
});

describe('pickChecksums', () => {
  it('keeps only the archives the build downloads', async () => {
    expect(await pickChecksums(SHASUMS, '99.99.99')).toEqual({
      'node-v99.99.99-linux-x64.tar.gz': sha(6),
      'node-v99.99.99-linux-arm64.tar.gz': sha(5),
      'node-v99.99.99-darwin-x64.tar.gz': sha(4),
      'node-v99.99.99-darwin-arm64.tar.gz': sha(2),
      'node-v99.99.99-win-x64.zip': sha(9),
    });
  });

  it('fails when an archive is missing or its checksum is malformed', async () => {
    await expect(
      pickChecksums(SHASUMS.replace(/^.*linux-arm64\.tar\.gz\n/m, ''), '99.99.99')
    ).rejects.toThrow('has no sha256 for node-v99.99.99-linux-arm64.tar.gz');
    await expect(pickChecksums(SHASUMS.replace(sha(9), 'not-a-sha'), '99.99.99')).rejects.toThrow(
      'has no sha256 for node-v99.99.99-win-x64.zip'
    );
  });
});
