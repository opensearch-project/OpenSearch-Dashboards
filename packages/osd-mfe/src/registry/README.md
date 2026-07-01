# `@osd/mfe` — Registry subsystem

The **registry** describes *which* Module Federation remotes each host loads at
boot: their URLs, integrity hashes, container triples, compatibility metadata,
and the layered rollout/tenant substructure. It is intentionally **DATA, not
code** — a single JSON document, read at serve time; a version flip is a data
edit reflected on the next request.

See `packages/osd-mfe/README.md` for the package-level design.

## Four core interfaces

| Interface | Where | What |
|---|---|---|
| `RegistryProvider` | `provider.ts` | Read-side of the FLAT in-memory shape (dev-override + browser fallback paths). `FileRegistryProvider` provides mtime hot-reload. |
| `RegistryReader` | `reader.ts` | Read-side of the LAYERED on-disk shape (`schemaVersion: 1`). Given `ResolutionDimensions`, returns a resolved `BootManifest`. `FileRegistryReader` is the reference impl. |
| `BootManifest` | `boot_manifest.ts` | The FLAT projection the server injects into the boot HTML. What the browser actually consumes — no second registry HTTP fetch. |
| `AssetDescriptor` | `schema.ts` | The `{ url, version, integrity }` triple every global asset (core, orchestrator, shared-deps CSS, theme) uses. |

## The unified schema (`schemaVersion: 1`)

```ts
interface RegistryDocument {
  schemaVersion: 1;
  generatedAt: string;

  default: {                              // Steady state
    sharedDeps: SharedDepsDescriptor;
    mfes: Record<string, MfeEntry>;
  };
  rollouts: RolloutRule[];                // Ordered partial overrides
  tenantOverrides: TenantOverride[];      // Full override by customerId

  core?: AssetDescriptor;                 // OSD core entry script
  orchestrator?: AssetDescriptor;         // MFE bootstrap engine
  sharedDepsCss?: AssetDescriptor;        // osd-ui-shared-deps.css
  themes?: Record<string, AssetDescriptor>;

  signature?: RegistrySignature;
}
```

Every field is optional at every layer; every absence falls back to a
well-defined `/bundles/...` server-hosted path.

## Resolution algorithm

Given `RegistryDocument` and `ResolutionDimensions = { env, customerId? }`:

1. Start from `default` — copy `sharedDeps` and `mfes` verbatim.
2. Apply `rollouts` in order — first matching rule's `override.mfes` and
   optional `override.sharedDeps` shallow-merge on top.
3. Apply matching `tenantOverrides[]` entry — full override for that plugin id.
4. Project global assets — `core` / `orchestrator` / `sharedDepsCss` /
   `themes` copied VERBATIM (global assets are UNMODULATED by dimensions).

Implementation in `resolve.ts`; merge semantics in `resolve.test.ts`.

## Authoring CLI (`update_cli.ts`)

`runUpdateCli(argv)` powers `scripts/update_registry.js`. Three disjoint modes:

| Mode | Flags | Effect |
|---|---|---|
| Full regen | `--all` | Discover `target/mfe/<id>/remoteEntry.js`, compute integrity, produce a fresh `default`. |
| Layered authoring | `--default-entry`, `--add-rollout`, `--remove-rollout`, `--tenant-override`, `--remove-tenant-override`, `--rollback`, `--reason "<text>"` | Edit the layered doc; append an entry to the audit log per operation. |
| Global asset | `--update-core`, `--update-orchestrator`, `--update-theme <name>`, `--update-shared-deps-css` | Read a build manifest, stamp the top-level `AssetDescriptor`. |

Every write is atomic (temp-file + rename), validated before it lands, and —
when `MFE_REGISTRY_SIGNING_KEY` is set — re-signs the doc so a signed registry
stays signed after every op.

## Signing model (registry authenticity)

The registry decides *which* code loads, so it is signed with a key the CDN
tamperer *lacks*:

- **Algorithm:** HMAC-SHA256; canonical serialization in `signing_common.ts`.
- **Envelope:** `signature: { algorithm, keyId, value }` — stored on the doc
  but stripped from the canonical bytes.
- **Key:** held in SERVER CONFIG and delivered to the browser by the TRUSTED
  OSD origin — not by the CDN that serves the registry.
- **Fail-closed:** when a verification key is present, an unsigned or
  mis-signed registry is REJECTED. `FileRegistryProvider` throws on the Node
  read path; `verify_registry_web.ts` refuses to boot on the browser side.

`signing.ts` (Node signer/verifier) and `verify_registry_web.ts` (browser
verifier, `crypto.subtle`) implement the platform-specific crypto; both share
`signing_common.ts` for the canonical bytes so signer and verifiers hash
byte-for-byte identical input.

## Consumer pointers

- **Browser bootstrap** — `packages/osd-mfe/src/bootstrap/README.md` (how the
  `BootManifest` is consumed: shell → compat classification → share-scope
  init → remote loading → degrade-on-failure).
- **Deploy pipeline** — `packages/osd-mfe/src/deploy/README.md` (how per-plugin
  CDN uploads produce the `DeployManifestData` the update CLI stamps).
- **Local dev harness** — `packages/osd-mfe/dev/README.md` (the `--mfe` boot,
  the local CDN, and the fixture registry).
