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

const fetch = require('node-fetch');
const AbortController = require('abort-controller');
const fs = require('fs');
const { promisify } = require('util');
const { pipeline, Transform } = require('stream');
const chalk = require('chalk');
const { createHash } = require('crypto');
const path = require('path');

const asyncPipeline = promisify(pipeline);
const SUPPORTED_PLATFORMS = ['linux', 'windows', 'darwin'];
const DAILY_SNAPSHOTS_BASE_URL = 'https://artifacts.opensearch.org/snapshots/core/opensearch';
// TODO: [RENAMEME] currently do not have an existing replacement
// issue: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/475
const PERMANENT_SNAPSHOTS_BASE_URL = '';
// Since we do not have a manifest URL, limiting how many RC checks to 5 should be more than enough
const MAX_RC_CHECK = 5;

const { cache } = require('./utils');
const { resolveCustomSnapshotUrl } = require('./custom_snapshots');
const { createCliError, isCliError } = require('./errors');

function getChecksumType(checksumUrl) {
  if (checksumUrl.endsWith('.sha512')) {
    return 'sha512';
  }

  throw new Error(`unable to determine checksum type: ${checksumUrl}`);
}

function headersToString(headers, indent = '') {
  return [...headers.entries()].reduce(
    (acc, [key, value]) => `${acc}\n${indent}${key}: ${value}`,
    ''
  );
}

async function retry(log, fn) {
  async function doAttempt(attempt) {
    try {
      return await fn();
    } catch (error) {
      if (isCliError(error) || attempt >= 5) {
        throw error;
      }

      log.warning('...failure, retrying in 5 seconds:', error.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      log.info('...retrying');
      return await doAttempt(attempt + 1);
    }
  }

  return await doAttempt(1);
}

// Setting this flag provides an easy way to run the latest un-promoted snapshot without having to look it up
function shouldUseUnverifiedSnapshot() {
  return !!process.env.OSD_OPENSEARCH_SNAPSHOT_USE_UNVERIFIED;
}

// Setting this flag provides an easy way to skip comparing the checksum
function skipVerifyChecksum() {
  return !!process.env.OSD_SNAPSHOT_SKIP_VERIFY_CHECKSUM;
}

async function fetchSnapshotManifest(url, log) {
  log.info('Downloading snapshot manifest from %s', chalk.bold(url));

  const abc = new AbortController();
  const resp = await retry(log, async () => await fetch(url, { signal: abc.signal }));
  const json = await resp.text();

  return { abc, resp, json };
}

async function verifySnapshotUrl(url, log) {
  log.info('Verifying snapshot URL at %s', chalk.bold(url));

  const abc = new AbortController();
  const resp = await retry(
    log,
    async () => await fetch(url, { signal: abc.signal }, { method: 'HEAD' })
  );

  return { abc, resp };
}

/**
 * @deprecated This method should not be used, uses logic for resources we do not have access to.
 */
async function getArtifactSpecForSnapshot(urlVersion, license, log) {
  const desiredVersion = urlVersion.replace('-SNAPSHOT', '');
  const desiredLicense = license === 'oss' ? 'oss' : 'default';

  const customManifestUrl = process.env.OPENSEARCH_SNAPSHOT_MANIFEST;
  const primaryManifestUrl = `${DAILY_SNAPSHOTS_BASE_URL}/${desiredVersion}/manifest-latest${
    shouldUseUnverifiedSnapshot() ? '' : '-verified'
  }.json`;
  const secondaryManifestUrl = `${PERMANENT_SNAPSHOTS_BASE_URL}/${desiredVersion}/manifest.json`;

  let { abc, resp, json } = await fetchSnapshotManifest(
    customManifestUrl || primaryManifestUrl,
    log
  );

  if (!customManifestUrl && !shouldUseUnverifiedSnapshot() && resp.status === 404) {
    log.info('Daily snapshot manifest not found, falling back to permanent manifest');
    ({ abc, resp, json } = await fetchSnapshotManifest(secondaryManifestUrl, log));
  }

  if (resp.status === 404) {
    abc.abort();
    throw createCliError(`Snapshots for ${desiredVersion} are not available`);
  }

  if (!resp.ok) {
    abc.abort();
    throw new Error(`Unable to read snapshot manifest: ${resp.statusText}\n  ${json}`);
  }

  const manifest = JSON.parse(json);

  const platform = process.platform === 'win32' ? 'windows' : process.platform;
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64';

  const archive = manifest.archives.find(
    (archive) =>
      archive.version === desiredVersion &&
      archive.platform === platform &&
      archive.license === desiredLicense &&
      archive.architecture === arch
  );

  if (!archive) {
    throw createCliError(
      `Snapshots for ${desiredVersion} are available, but couldn't find an artifact in the manifest for [${desiredVersion}, ${desiredLicense}, ${platform}]`
    );
  }

  return {
    url: archive.url,
    checksumUrl: archive.url + '.sha512',
    checksumType: 'sha512',
    filename: archive.filename,
  };
}

async function getArtifactSpecForSnapshotFromUrl(urlVersion, log) {
  const desiredVersion = urlVersion.replace('-SNAPSHOT', '');

  if (process.env.OPENSEARCH_SNAPSHOT_MANIFEST) {
    return await getArtifactSpecForSnapshot(urlVersion, 'oss', log);
  }

  // [RENAMEME] Need replacement for other platforms.
  // issue: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/475
  const platform = process.platform === 'win32' ? 'windows' : process.platform;
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
  const extension = process.platform === 'win32' ? 'zip' : 'tar.gz';

  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    throw createCliError(`Snapshots are only available for Linux, Windows, and Darwin`);
  }

  const latestUrl = `${DAILY_SNAPSHOTS_BASE_URL}/${desiredVersion}-SNAPSHOT`;
  const latestFile = `opensearch-min-${desiredVersion}-SNAPSHOT-${platform}-${arch}-latest.${extension}`;
  const completeLatestUrl = `${latestUrl}/${latestFile}`;

  let { abc, resp } = await verifySnapshotUrl(completeLatestUrl, log);

  if (resp.ok) {
    return {
      url: completeLatestUrl,
      checksumUrl: completeLatestUrl + '.sha512',
      checksumType: 'sha512',
      filename: latestFile,
    };
  }

  log.info(
    'Daily general-availability snapshot URL not found for current version, falling back to release-candidate snapshot URL.'
  );

  let completeUrl = null;
  let snapshotFile = null;

  /**
   * TODO: This might not be relevant anymore. After a few iterations if RC builds are no longer being built
   * then we can remove this logic.
   *
   * This checks and uses an RC if a RC exists at a higher increment than RC1 or it tries to use RC1
   * This is in replacement of having a manifest URL, so the exact RC number is unknown but expect it not to be a large number
   */
  let rcCheck = MAX_RC_CHECK;
  do {
    const secondaryLatestUrl = `${DAILY_SNAPSHOTS_BASE_URL}/${desiredVersion}-rc${rcCheck}`;
    const secondaryLatestFile = `opensearch-${desiredVersion}-rc${rcCheck}-SNAPSHOT-${platform}-${arch}-latest.tar.gz`;
    const completeSecondaryLatestUrl = `${secondaryLatestUrl}/${secondaryLatestFile}`;
    ({ abc, resp } = await verifySnapshotUrl(completeSecondaryLatestUrl, log));

    if (resp.ok) {
      completeUrl = completeSecondaryLatestUrl;
      snapshotFile = secondaryLatestFile;
      break;
    }
  } while (rcCheck-- >= 1);

  if (resp.status === 404 || !completeUrl || !snapshotFile) {
    abc.abort();
    throw createCliError(`Snapshots for ${desiredVersion} are not available`);
  }

  if (!resp.ok) {
    abc.abort();
    throw new Error(`Unable to read snapshot url: ${resp.statusText}`);
  }

  return {
    url: completeUrl,
    checksumUrl: completeUrl + '.sha512',
    checksumType: 'sha512',
    filename: snapshotFile,
  };
}

exports.Artifact = class Artifact {
  /**
   * Fetch an Artifact from the Artifact API for a license level and version.
   * Only OSS license should be used but the param was left to mitigate impact
   * until a later iteration.
   *
   * TODO: [RENAMEME] remove license param
   * issue: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/475
   *
   * @param {('oss')} license
   * @param {string} version
   * @param {ToolingLog} log
   */
  static async getSnapshot(license, version, log) {
    const urlVersion = `${encodeURIComponent(version)}-SNAPSHOT`;

    const customSnapshotArtifactSpec = resolveCustomSnapshotUrl(urlVersion, license);
    if (customSnapshotArtifactSpec) {
      return new Artifact(customSnapshotArtifactSpec, log);
    }

    const artifactSpec = await getArtifactSpecForSnapshotFromUrl(urlVersion, log);
    return new Artifact(artifactSpec, log);
  }

  /**
   * Fetch an Artifact from the OpenSearch past releases url
   * @param {string} url
   * @param {ToolingLog} log
   */
  static async getArchive(url, log) {
    const shaUrl = `${url}.sha512`;

    const artifactSpec = {
      url: url,
      filename: path.basename(url),
      checksumUrl: shaUrl,
      checksumType: getChecksumType(shaUrl),
    };

    return new Artifact(artifactSpec, log);
  }

  constructor(spec, log) {
    this._spec = spec;
    this._log = log;
  }

  getUrl() {
    return this._spec.url;
  }

  getChecksumUrl() {
    return this._spec.checksumUrl;
  }

  getChecksumType() {
    return this._spec.checksumType;
  }

  getFilename() {
    return this._spec.filename;
  }

  /**
   * Download the artifact to disk, skips the download if the cache is
   * up-to-date, verifies checksum when downloaded
   * @param {string} dest
   * @return {Promise<void>}
   */
  async download(dest) {
    await retry(this._log, async () => {
      const cacheMeta = cache.readMeta(dest);
      const tmpPath = `${dest}.tmp`;

      const artifactResp = await this._download(tmpPath, cacheMeta.etag, cacheMeta.ts);
      if (artifactResp.cached) {
        return;
      }

      if (!skipVerifyChecksum()) {
        await this._verifyChecksum(artifactResp);
      }

      // cache the etag for future downloads
      cache.writeMeta(dest, { etag: artifactResp.etag });

      // rename temp download to the destination location
      fs.renameSync(tmpPath, dest);
    });
  }

  /**
   * Fetch the artifact with an etag
   * @param {string} tmpPath
   * @param {string} etag
   * @param {string} ts
   * @return {{ cached: true }|{ checksum: string, etag: string, first500Bytes: Buffer }}
   */
  async _download(tmpPath, etag, ts) {
    const url = this.getUrl();

    if (etag) {
      this._log.info('verifying cache of %s', chalk.bold(url));
    } else {
      this._log.info('downloading artifact from %s', chalk.bold(url));
    }

    const abc = new AbortController();
    const resp = await fetch(url, {
      signal: abc.signal,
      headers: {
        'If-None-Match': etag,
      },
    });

    if (resp.status === 304) {
      this._log.info('etags match, reusing cache from %s', chalk.bold(ts));

      abc.abort();
      return {
        cached: true,
      };
    }

    if (!resp.ok) {
      abc.abort();
      throw new Error(
        `Unable to download opensearch snapshot: ${resp.statusText}${headersToString(
          resp.headers,
          '  '
        )}`
      );
    }

    if (etag) {
      this._log.info('cache invalid, redownloading');
    }

    const hash = createHash(this.getChecksumType());
    let first500Bytes = Buffer.alloc(0);
    let contentLength = 0;

    fs.mkdirSync(path.dirname(tmpPath), { recursive: true });

    await asyncPipeline(
      resp.body,
      new Transform({
        transform(chunk, encoding, cb) {
          contentLength += Buffer.byteLength(chunk);

          if (first500Bytes.length < 500) {
            first500Bytes = Buffer.concat(
              [first500Bytes, chunk],
              first500Bytes.length + chunk.length
            ).slice(0, 500);
          }

          hash.update(chunk, encoding);
          cb(null, chunk);
        },
      }),
      fs.createWriteStream(tmpPath)
    );

    return {
      checksum: hash.digest('hex'),
      etag: resp.headers.get('etag'),
      contentLength,
      first500Bytes,
      headers: resp.headers,
    };
  }

  /**
   * Verify the checksum of the downloaded artifact with the checksum at checksumUrl
   * @param {{ checksum: string, contentLength: number, first500Bytes: Buffer }} artifactResp
   * @return {Promise<void>}
   */
  async _verifyChecksum(artifactResp) {
    this._log.info('downloading artifact checksum from %s', chalk.bold(this.getChecksumUrl()));

    const abc = new AbortController();
    const resp = await fetch(this.getChecksumUrl(), {
      signal: abc.signal,
    });

    if (!resp.ok) {
      abc.abort();
      throw new Error(
        `Unable to download opensearch checksum: ${resp.statusText}${headersToString(
          resp.headers,
          '  '
        )}`
      );
    }

    // in format of stdout from `shasum` cmd, which is `<checksum>   <filename>`
    const [expectedChecksum] = (await resp.text()).split(' ');
    if (artifactResp.checksum !== expectedChecksum) {
      const len = Buffer.byteLength(artifactResp.first500Bytes);
      const lenString = `${len} / ${artifactResp.contentLength}`;

      throw createCliError(
        `artifact downloaded from ${this.getUrl()} does not match expected checksum\n` +
          `  expected: ${expectedChecksum}\n` +
          `  received: ${artifactResp.checksum}\n` +
          `  headers: ${headersToString(artifactResp.headers, '    ')}\n` +
          `  content[${lenString} base64]: ${artifactResp.first500Bytes.toString('base64')}`
      );
    }

    this._log.info('checksum verified');
  }
};
