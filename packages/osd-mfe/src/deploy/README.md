# `@osd/mfe` — Deploy subsystem

The **deploy** subsystem publishes built MFE artifacts to a pre-provisioned
CDN (S3 + CloudFront) and emits a deploy manifest the registry-authoring CLI
consumes to update the on-disk registry document.

**PUBLISH-ONLY and INFRA-AGNOSTIC.** The S3 bucket and CloudFront distribution
are provisioned separately (`harness/provision_cdn.sh` or a future CDK stack).
This code NEVER runs `create-bucket`, `create-distribution`, `put-bucket-policy`,
or `put-public-access-block` — the only AWS operations are `s3api head-object`
(immutability check) and `s3 cp --recursive` (upload).

See `packages/osd-mfe/README.md` for the package-level design and
`packages/osd-mfe/src/registry/README.md` for the schema this feeds.

## The deploy plan (`plan.ts`)

`buildDeployPlan(options)` is a PURE library function: it reads
`target/mfe/<id>/remoteEntry.js` and `packages/osd-ui-shared-deps/target/`,
content-addresses each artifact, and returns the exact S3 keys + CloudFront
URLs the deploy WOULD publish. No AWS calls, no writes.

Versioning matches `registry/generate.ts` EXACTLY:

- `contentHash = sha256(remoteEntry.js)[:12]`
- `version    = "<osdVersion>+<contentHash>"`
- `integrity  = sha384(remoteEntry.js)` (SRI, over the UNCOMPRESSED bytes)

Artifacts land at immutable, content-addressed paths:

- Plugin: `<prefix>/<id>/<contentHash>/remoteEntry.js`
- Shared-deps: `<prefix>/shared-deps/<contentHash>/...`
- Global assets: `<prefix>/{core,orchestrator,themes/<name>,shared-deps/css}/<hash>/`

An artifact whose bytes have not changed produces the same content hash and
therefore the same key — a repeat deploy is a no-op after the head-object
immutability check.

## Upload semantics (`deploy_cli.ts` — `s3_uploader` logic)

Per-artifact upload:

1. **Immutability check** — `aws s3api head-object` on the target key. If it
   exists, skip (never overwrite a published artifact in place).
2. **Stage a gzipped copy** — every publishable file (excluding `*.map`) is
   gzip-compressed to a temp directory, filenames preserved.
3. **Upload** — `aws s3 cp --recursive --content-encoding gzip <staging> s3://...`.
   CloudFront serves the already-compressed bytes through (fixes the 27.8MB
   shared-deps that would otherwise skip its auto-compress cap). Content-Type
   is inferred from filename extension.

SRI is computed over the ORIGINAL uncompressed bytes (the browser verifies SRI
against the decoded response body), so the integrity value carried in the
deploy manifest and stamped onto the registry entry is byte-compatible with
what the browser sees.

## Deploy manifest — the producer/consumer contract

Emitted next to the registry data file. Shape (`DeployManifest`):

```ts
{
  schemaVersion: 1;
  generatedAt: string;                 // ISO-8601
  cdn: { bucket, region, baseUrl, keyPrefix, distributionId?, domain? };
  sharedDeps?: { version, key, cdnUrl, fileCount };
  mfes: {
    [id]: { version, contentHash, key, cdnUrl, fileCount, integrity };
  };
  globalAssets?: {                     // populated by single-asset deploys
    [assetKey]: { url, version, integrity };
    // assetKey ∈ "core" | "orchestrator" | "sharedDepsCss" | "theme:<name>"
  };
}
```

The registry-authoring CLI (`update_cli.ts`) reads this manifest under
`--from-manifest` / `--update-{core,orchestrator,theme,shared-deps-css}` and
stamps the registry document. Two disjoint sets of manifest fields drive two
disjoint sets of authoring operations (plugins vs global assets).

## Deploy modes

| Mode | Flags | Populates in manifest |
|---|---|---|
| Full deploy | *(no mode flag)* | `mfes` (all) + `sharedDeps` |
| Single-plugin | `--plugin <id>` (`--with-shared-deps` optional) | `mfes[<id>]` only |
| Global asset | `--core <build-manifest>` / `--orchestrator` / `--theme <name> <build-manifest>` / `--shared-deps-css` (`--update-manifest` optional) | `globalAssets[<key>]` |

Deploy modes are mutually exclusive — passing `--plugin` with any global-asset
flag is rejected.

## CloudFront invalidation

Not performed by this code path. Because every published artifact is
content-addressed (a byte change produces a new URL), a stale cached copy at
the OLD URL is harmless — nothing references it after the registry flip. The
new hash-addressed URL has no cache entry to invalidate.

If a use case ever requires invalidation (e.g. removing a leaked artifact),
run `aws cloudfront create-invalidation` separately — the deploy code
deliberately does not perform any distribution mutations.

## Files

| File | Purpose |
|---|---|
| `plan.ts` | Pure library — build the immutable versioned deploy plan. |
| `deploy_cli.ts` | The `deploy_mfe` CLI: full / single-plugin / global-asset modes; upload; manifest write. |
| `cdn_config.ts` | Resolve provisioned CDN coordinates from env + `cdn_outputs.env`. |
| `index.ts` | Public surface (types + functions used by the registry CLI). |
