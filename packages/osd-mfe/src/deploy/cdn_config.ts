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

/**
 * Resolve the PRE-PROVISIONED CDN location for the publish-only deploy.
 *
 * The S3 bucket + CloudFront distribution are provisioned SEPARATELY
 * (`harness/provision_cdn.sh` / future CDK). The deploy command never creates or
 * mutates infra — it only needs to know WHERE to publish. That location is read
 * from the environment (the harness `env.sh` sources `harness/cdn_outputs.env`
 * into `process.env`), with a direct parse of `cdn_outputs.env` as a fallback so
 * the values are NEVER hardcoded in source. See `packages/osd-mfe/README.md`.
 */

/** The provisioned CDN coordinates the deploy publishes artifacts to. */
export interface ResolvedCdnConfig {
  /** Target S3 bucket name (provisioned separately; private/OAC-only). */
  bucket: string;
  /** AWS region the bucket/distribution live in. */
  region: string;
  /** Public CloudFront base URL (e.g. `https://abc123.cloudfront.net`), no trailing slash. */
  baseUrl: string;
  /** Key prefix under which all MFE artifacts are published (e.g. `mfe`), no slashes. */
  keyPrefix: string;
  /** CloudFront distribution id (recorded in the manifest; not required to publish). */
  distributionId?: string;
  /** CloudFront domain (recorded in the manifest; not required to publish). */
  domain?: string;
}

/** Environment variable names that carry the provisioned CDN coordinates. */
const ENV_KEYS = {
  bucket: 'CDN_BUCKET',
  region: 'CDN_REGION',
  baseUrl: 'CDN_BASE_URL',
  keyPrefix: 'CDN_KEY_PREFIX',
  distributionId: 'CDN_DISTRIBUTION_ID',
  domain: 'CDN_DOMAIN',
} as const;

/**
 * Parse a dotenv-style file (`KEY=value`, `#` comments, blank lines) into a map.
 *
 * This intentionally implements only the tiny subset `cdn_outputs.env` uses: it
 * strips an optional surrounding pair of single/double quotes and ignores any
 * leading `export ` keyword. It never executes the file (no shell) so it cannot
 * run provisioning commands — it is pure data extraction.
 */
export function parseEnvFile(contents: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) {
      continue;
    }
    const withoutExport = line.startsWith('export ') ? line.slice('export '.length) : line;
    const eq = withoutExport.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = withoutExport.slice(0, eq).trim();
    let value = withoutExport.slice(eq + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    if (key.length > 0) {
      result[key] = value;
    }
  }
  return result;
}

/** Read a value, preferring the live environment over the parsed file. */
function pick(
  envKey: string,
  env: NodeJS.ProcessEnv,
  fileEnv: Record<string, string>
): string | undefined {
  const fromEnv = env[envKey];
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv;
  }
  const fromFile = fileEnv[envKey];
  if (typeof fromFile === 'string' && fromFile.length > 0) {
    return fromFile;
  }
  return undefined;
}

/** Normalise a key prefix: trim and strip any leading/trailing slashes. */
function normalizeKeyPrefix(value: string): string {
  return value.replace(/^\/+/, '').replace(/\/+$/, '');
}

/**
 * Resolve the provisioned CDN configuration from the environment (preferred) and
 * an optional already-parsed `cdn_outputs.env` map (fallback). The live env
 * always wins so an operator can override a single value ad hoc.
 *
 * @param env process environment (typically `process.env`)
 * @param fileEnv parsed `cdn_outputs.env` contents (pass `{}` when unavailable)
 * @returns the validated, normalised {@link ResolvedCdnConfig}
 * @throws Error listing every missing/invalid field, with remediation guidance
 */
export function resolveCdnConfig(
  env: NodeJS.ProcessEnv,
  fileEnv: Record<string, string> = {}
): ResolvedCdnConfig {
  const bucket = pick(ENV_KEYS.bucket, env, fileEnv);
  const region = pick(ENV_KEYS.region, env, fileEnv);
  const baseUrlRaw = pick(ENV_KEYS.baseUrl, env, fileEnv);
  const keyPrefixRaw = pick(ENV_KEYS.keyPrefix, env, fileEnv);
  const distributionId = pick(ENV_KEYS.distributionId, env, fileEnv);
  const domain = pick(ENV_KEYS.domain, env, fileEnv);

  const errors: string[] = [];
  if (bucket === undefined) {
    errors.push(`${ENV_KEYS.bucket} is required (the provisioned S3 bucket)`);
  }
  if (region === undefined) {
    errors.push(`${ENV_KEYS.region} is required (the bucket/distribution region)`);
  }
  if (baseUrlRaw === undefined) {
    errors.push(`${ENV_KEYS.baseUrl} is required (the CloudFront base URL)`);
  } else if (!/^https?:\/\//.test(baseUrlRaw)) {
    errors.push(`${ENV_KEYS.baseUrl} must be an http(s) URL (got "${baseUrlRaw}")`);
  }
  if (keyPrefixRaw === undefined) {
    errors.push(`${ENV_KEYS.keyPrefix} is required (the S3 key prefix, e.g. "mfe")`);
  }

  if (errors.length > 0) {
    throw new Error(
      `Cannot resolve the provisioned CDN location:\n  - ${errors.join('\n  - ')}\n` +
        'Source the harness env (`source harness/env.sh`, which loads ' +
        'harness/cdn_outputs.env) or pass --cdn-outputs <path>. The deploy is ' +
        'PUBLISH-ONLY and never provisions these resources.'
    );
  }

  return {
    bucket: bucket as string,
    region: region as string,
    baseUrl: (baseUrlRaw as string).replace(/\/+$/, ''),
    keyPrefix: normalizeKeyPrefix(keyPrefixRaw as string),
    ...(distributionId !== undefined ? { distributionId } : {}),
    ...(domain !== undefined ? { domain } : {}),
  };
}
