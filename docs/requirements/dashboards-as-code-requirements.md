# Dashboards-as-Code & Observability-as-Code for OpenSearch Dashboards

## Product Requirements Document

**Status:** Draft
**Date:** 2026-03-23
**Author:** Engineering
**Classification:** Internal / Customer-Facing Strategy

---

## 1. Executive Summary

The observability industry is rapidly converging on **"as-code" workflows** as the standard for managing dashboards, alerts, SLOs, and data source configurations. Grafana 12, Perses, Datadog, Dynatrace, and New Relic have all shipped — or are actively shipping — first-class tooling that treats observability resources as version-controlled, reviewable, testable code artifacts.

**OpenSearch Dashboards currently has no native as-code story.** Customers managing dashboards at scale rely on manual UI operations, fragile ndjson import/export, or custom scripts against the Saved Objects API. This document defines the requirements for a competitive, customer-centric Dashboards-as-Code capability for OpenSearch Dashboards.

---

## 2. Market Context & Competitive Landscape

### 2.1 Grafana 12 — Observability-as-Code (Released 2025)

Grafana has made the most aggressive push, building a full-stack as-code platform:

| Capability | Status | Details |
|---|---|---|
| **Kubernetes-style Resource APIs** | Experimental | Versioned `/apis/...` endpoints (`v1beta1`) alongside legacy `/api/...`. Consistent, resource-oriented design. |
| **Dashboard Schema v2** | Experimental | Decouples layout from panel config. Cleaner JSON, optimized for Git diffs. |
| **Git Sync** | Experimental (OSS), Private Preview (Cloud) | Bi-directional GitHub sync from the UI. Save to `main` or feature branches. PR creation from save modal. Dashboard image previews in PRs. Planned: GitLab, Bitbucket, plain Git. |
| **Foundation SDK** | Public Preview | Multi-language: **Go, Java, PHP, Python, TypeScript**. Strongly-typed builders. Synced with Grafana release cycles. |
| **grafanactl CLI** | Public Preview | Get, pull, push, validate resources. SDK integration for local previews. Multi-instance sync. |
| **Terraform Provider** | Public Preview | Auto-generated resources from App Platform APIs. Schema-based validation. Drift detection via Terraform state. |
| **Grafonnet (Jsonnet)** | Stable (community) | Auto-generated Jsonnet library from OpenAPI specs. 30+ panel types. Prometheus, Loki, Elasticsearch query builders. |

**Key Insight:** Grafana is betting on a **Kubernetes-style API foundation** that all tooling (SDKs, CLI, Terraform, Git Sync) builds on top of. This is architecturally sound and creates a flywheel effect.

### 2.2 Perses — Dashboard-as-Code (CNCF Project)

Perses is a CNCF-sandbox project purpose-built for dashboard-as-code:

| Capability | Details |
|---|---|
| **CUE SDK** | First-class CUE language support. Schema validation, IDE support, plugin integration. Uses CUE modules for dependency management. |
| **Go SDK** | Builder-pattern API for programmatic dashboard construction. Functional options pattern (`dashboard.New("name", options...)`). |
| **percli CLI** | `dac setup` (scaffold), `dac build` (compile to JSON/YAML), `dac diff` (compare local vs. server), `dac preview` (ephemeral dashboards), `apply` (deploy), `lint` (validate with custom rules). |
| **GitHub Actions** | Official `perses/cli-actions` library with pre-configured workflows and individual actions for build, validate, deploy. |
| **Plugin Architecture** | Plugins provide SDK pieces per language. Official plugins fully support CUE + Go. Third-party plugins may vary. Plugins: Prometheus, TimeSeries, Table, Loki, Pyroscope, Tempo, ClickHouse. |
| **Kubernetes Operator** | `perses-operator` enables dashboard definitions as Kubernetes CRDs in application namespaces. Full GitOps via ArgoCD/Flux. |
| **Validation** | Multi-level: offline schema validation, online server validation, custom lint rules (YAML-configured organizational policies). |
| **Output Formats** | JSON and YAML. One dashboard per file convention. Batch builds via directory option. |

**Key Insight:** Perses demonstrates that a focused, open-source DaC tool with **CUE + Go SDKs and a purpose-built CLI** can deliver an excellent developer experience. Their `dac diff` (compare local vs. deployed) and `dac preview` (ephemeral test dashboards) commands are particularly strong UX patterns to emulate. The plugin-per-SDK-language model is elegant.

### 2.3 Datadog

| Capability | Details |
|---|---|
| **Dashboard API** | Full REST API for CRUD operations on dashboards, monitors, SLOs, synthetics, incidents. JSON definitions. |
| **Official SDKs** | Python, Go, Java, Ruby, TypeScript API clients with sync/async support, pagination, retry logic, proxy config. **Broadest SDK language coverage among observability vendors.** |
| **Terraform Provider** | Mature, officially maintained by Datadog (2,755+ commits, 420+ forks). Resources for dashboards, monitors, SLOs, synthetics, downtimes, log configs. |
| **Pulumi Provider** | Multi-language support (TypeScript, Python, Go, C#, Java) for all Datadog resources. Community-maintained (pulumiverse). |
| **Datadog Operator** | Kubernetes-native CRDs for managing monitors and SLOs as Kubernetes resources. |

### 2.4 Dynatrace — Monaco

| Capability | Details |
|---|---|
| **Monaco CLI** | Official configuration-as-code tool. Go-based binary (98.8% Go). Apache 2.0 license. Active release cadence (v2.28+, 91+ releases). |
| **Scope** | Dashboards, alerting profiles, management zones, auto-tagging, request attributes, calculated metrics, SLOs, synthetic monitors. Branded as **"Observability as Code and Security as Code."** |
| **Multi-Environment** | Purpose-built for deploying standardized + customized configs across many Dynatrace environments. Per-environment overrides. |
| **GitOps** | Designed for Git-based workflows. Environment-specific overrides. Dry-run support. |
| **CI/CD** | Built-in support for Jenkins, GitHub Actions, GitLab CI. CLI-first design for pipeline automation. |
| **Coexistence** | Official guidance helps users choose between Monaco and Terraform Dynatrace provider based on use case. |

### 2.5 New Relic

| Capability | Details |
|---|---|
| **NerdGraph API** | GraphQL API for dashboards, alerts, SLOs. Programmatic CRUD. |
| **Terraform Provider** | Officially maintained. Resources for dashboards, alert policies, NRQL conditions, synthetics. |
| **NR CLI (newrelic-cli)** | Command-line tool for entity management and deployment markers. |

### 2.6 Grafonnet (Jsonnet for Grafana)

| Capability | Details |
|---|---|
| **What it is** | Auto-generated Jsonnet library from Grafana's OpenAPI specs (grafana-foundation-sdk). Successor to grafonnet-lib. |
| **Panel types** | 30+ panels: TimeSeries, Bar, Pie, Heatmap, Gauge, Table, Logs, Geomap, Canvas, Candlestick, etc. |
| **Query builders** | Prometheus, Loki, CloudWatch, Elasticsearch, Azure Monitor integrations. |
| **Status** | Experimental. Performance-optimized (avoids builder pattern that was slow at scale in grafonnet-lib). |
| **Key value** | Eliminates duplication via parameterized, reusable dashboard components. Compiles to standard Grafana JSON. |

### 2.7 Infrastructure-as-Code Ecosystem

| Tool | Languages | Observability Support |
|---|---|---|
| **Terraform** | HCL | Grafana, Datadog, New Relic, Dynatrace, PagerDuty, Elastic providers. State-based drift detection. `plan` shows drift. |
| **Pulumi** | TypeScript, Python, Go, C#, Java, YAML | Grafana, Datadog providers. Full programming language power. Native unit + integration testing. |
| **Crossplane** | YAML (Kubernetes CRDs) | Kubernetes-native IaC. Provider model extensible to observability. |

### 2.8 Key Competitive Takeaways

1. **Terraform dominates multi-vendor IaC** — both Grafana and Datadog have official, actively maintained providers. This is the most common path for teams already using Terraform.
2. **Grafana has the richest native as-code ecosystem** — JSON provisioning, Grafonnet/Jsonnet, Foundation SDK, Terraform, Kubernetes Operator. More options than any other vendor.
3. **Drift detection is a key differentiator for IaC tools** (Terraform, Pulumi) over native APIs/SDKs that require custom drift implementation.
4. **Datadog's SDK breadth** (6+ languages) makes programmatic management accessible without IaC tooling.
5. **Dynatrace Monaco is unique** in combining observability + security configuration in a single multi-environment CLI.

---

## 3. Current State of OpenSearch Dashboards

### What exists today:

- **Saved Objects API**: CRUD for dashboards, visualizations, index patterns, saved searches. Supports find/search with filtering and reference tracking between objects. Battle-tested and deployed in production across the OpenSearch ecosystem.
- **ndjson Import/Export**: Bulk export/import via UI or API (`_export` / `_import` endpoints). Used widely for backup and migration.
- **Saved Objects Management UI**: Manual point-and-click management for individual resources.

### What the Saved Objects API already provides (and should be reused):

| Capability | Status |
|---|---|
| CRUD for all dashboard resource types | Stable, production-ready |
| Bulk export/import (ndjson) | Stable |
| Find/search with filtering | Stable |
| Object reference tracking | Stable |
| Multi-tenant/workspace support | Stable |

### Gaps that need to be addressed on top of the existing API:

| Gap | Impact |
|---|---|
| No validation-only mode (dry-run) | Cannot validate dashboard definitions before persisting — forces trial-and-error deployment |
| No diff endpoint | Cannot compare local definitions against deployed state server-side |
| No resource metadata (labels, annotations) | Cannot organize/filter dashboards at scale; no support for ownership, environment tags, or policy labels |
| Untyped `attributes` blob | Schema is not documented as a stable contract; SDK generation and validation are impossible without a formal schema |
| Not Git-diff-friendly | IDs, references, and deep nesting make JSON diffs noisy and hard to review |
| No optimistic concurrency | No version/generation counter — concurrent edits can silently overwrite each other |
| No multi-language SDK | Customers cannot programmatically define dashboards in their language of choice |
| No purpose-built CLI | No `build`, `validate`, `diff`, `apply` workflow for dashboards |
| No Git-native workflow | No bi-directional sync, no PR previews, no branch-based editing |
| No Terraform/Pulumi provider | Cannot manage OpenSearch Dashboards resources alongside other infrastructure |
| No CI/CD tooling | No GitHub Actions, no pipeline integrations for dashboard deployment |
| No alerting/SLO-as-code | Monitor and alert definitions are UI-only |

---

## 4. Requirements

### 4.1 Saved Objects API Extensions (P0 — Must Have)

**Rationale:** The existing Saved Objects API provides solid CRUD foundations. Rather than building a parallel API from scratch, we extend it with the capabilities needed for as-code workflows. This mirrors Grafana's approach — their new `/apis/...` endpoints coexist with legacy `/api/...` during a transition period.

**Approach:** Build a **versioned schema layer and as-code endpoints on top of the Saved Objects API**, not a replacement.

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| API-1 | **Typed, versioned schema for each resource type** | Publish formal JSON Schema / OpenAPI specs for dashboards, visualizations, index patterns, saved searches. The existing `attributes` blob gets a documented, stable schema contract. Schema versions tracked (e.g., `dashboard/v1`). SDKs and validation are generated from these schemas. |
| API-2 | **Dry-run / validation endpoint** | New endpoint (e.g., `POST /api/saved_objects/_validate`) or `?dryRun=true` query parameter on existing endpoints. Validates resource definitions against the typed schema without persisting. Returns detailed, field-level validation errors. Supports both local (schema-only) and server-side (plugin-aware) validation modes. |
| API-3 | **Git-diff-friendly export format** | New export mode that produces deterministic, human-readable JSON/YAML: sorted keys, stable IDs, layout decoupled from panel config (Grafana Schema v2 pattern), minimal nesting. Available alongside existing ndjson export. |
| API-4 | **Resource metadata: labels & annotations** | Extend Saved Objects with user-defined `labels` (key-value for filtering/selection, e.g., `env: prod`, `team: platform`) and `annotations` (free-form metadata, e.g., `owner: jane@company.com`). Queryable via the existing find/search API. |
| API-5 | **Optimistic concurrency control** | Add `version` or `generation` counter to Saved Objects. Update/delete operations require the current version — returns `409 Conflict` on mismatch. Prevents silent overwrites from concurrent edits (UI + as-code). |
| API-6 | **Diff endpoint** | New endpoint (e.g., `POST /api/saved_objects/_diff`) accepts a resource definition and returns a structured diff against the currently deployed version. Powers the CLI `diff` command server-side. |
| API-7 | **Bulk operations enhancement** | Extend existing `_export` / `_import` with transactional semantics: all-or-nothing apply, rollback on failure. Add `_bulk_apply` for create-or-update in a single call. |

### 4.2 Multi-Language SDK (P0 — Must Have)

**Rationale:** Grafana supports 5 languages. Perses supports CUE + Go. Customers expect to define dashboards in their stack's language.

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| SDK-1 | **TypeScript/JavaScript SDK** | Builder-pattern API for dashboards, panels, visualizations, queries, variables. Strongly typed. Published to npm. |
| SDK-2 | **Python SDK** | Builder-pattern API. Published to PyPI. First-class support for data engineering / ML teams. |
| SDK-3 | **Go SDK** | Builder-pattern API. Published as Go module. Enables infrastructure-team adoption. |
| SDK-4 | **Java SDK** | Builder-pattern API. Published to Maven Central. Enterprise customer requirement. |
| SDK-5 | **SDK auto-generation from schema** | SDKs generated from OpenAPI/JSON Schema specs (Grafana Foundation SDK pattern). Synchronized with release cycles. |
| SDK-6 | **Composable, reusable components** | SDK supports defining reusable panel templates, variable sets, and dashboard fragments that can be shared across dashboards. |
| SDK-7 | **Output to JSON/YAML** | SDKs compile dashboard definitions to validated JSON or YAML files suitable for version control. |

### 4.3 CLI Tool — `opensearch-dashboards-cli` or `osdctl` (P0 — Must Have)

**Rationale:** Both Perses (`percli`) and Grafana (`grafanactl`) ship dedicated CLIs. This is the primary developer interface.

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| CLI-1 | **`init` / `setup`** | Scaffold a new DaC project with SDK dependencies, folder structure, and example dashboard. Language selection flag. |
| CLI-2 | **`build`** | Compile SDK source files (TS, Python, Go, Java) into validated JSON/YAML dashboard definitions. Single file and directory modes. |
| CLI-3 | **`validate`** | Validate dashboard definitions against the schema. Local-only validation and server-side validation modes. Detailed error reporting. |
| CLI-4 | **`diff`** | Show differences between local dashboard definitions and deployed state. Colorized, human-readable output. |
| CLI-5 | **`apply`** | Deploy dashboard definitions to an OpenSearch Dashboards instance. Support for create, update, and delete operations. Dry-run mode. |
| CLI-6 | **`pull`** | Export deployed dashboards from a running instance into local SDK-compatible or JSON/YAML format. |
| CLI-7 | **`push`** | Push local definitions to a remote instance. Conflict detection and resolution options. |
| CLI-8 | **`lint`** | Check dashboard definitions against best practices and organizational policies (naming conventions, required labels, data source restrictions). Configurable rule sets. |
| CLI-9 | **Multi-instance support** | Named connection profiles for managing dashboards across dev/staging/prod environments. |
| CLI-10 | **`convert`** | Convert between formats: Grafana JSON to OpenSearch Dashboards format, ndjson to new schema, legacy to v2 schema. Migration aid. (Perses has `migrate` for Grafana-to-Perses conversion.) |
| CLI-11 | **`preview`** | Create ephemeral/temporary dashboards on a running instance for testing before full deployment. (Mirrors Perses `dac preview`.) |

### 4.4 Git-Native Workflows (P1 — High Priority)

**Rationale:** Grafana Git Sync is a headline feature. Customers managing 100+ dashboards need version control.

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| GIT-1 | **Git Sync** | Bi-directional synchronization between OpenSearch Dashboards and a Git repository (GitHub, GitLab, Bitbucket). Configurable sync branch. |
| GIT-2 | **Branch-based editing** | Save dashboard changes to feature branches from the UI. Create PRs/MRs directly. |
| GIT-3 | **PR preview rendering** | Generate dashboard preview images or links for pull request reviews. Integrate with GitHub/GitLab PR comments. |
| GIT-4 | **Webhook-driven sync** | Automatic deployment on merge to main branch via webhook. Configurable per repository. |
| GIT-5 | **Conflict resolution** | Detect and surface conflicts when UI changes and Git changes diverge. Three-way merge support or clear override policy. |
| GIT-6 | **Audit trail** | Full history of who changed what, when, with Git commit references. Queryable via API. |

### 4.5 CI/CD Integration (P1 — High Priority)

**Rationale:** Perses ships GitHub Actions. Grafana's CLI is designed for pipeline integration. This is table-stakes for enterprise adoption.

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| CI-1 | **GitHub Actions** | Official action library: `setup-osdctl`, `build-dashboards`, `validate-dashboards`, `deploy-dashboards`. Composite workflow for common patterns. |
| CI-2 | **GitLab CI templates** | Official `.gitlab-ci.yml` templates for build, validate, deploy pipeline stages. |
| CI-3 | **Jenkins shared library** | Reusable pipeline steps for Jenkins-based organizations. |
| CI-4 | **Generic CI support** | CLI-based workflow that works with any CI/CD system (CircleCI, Azure DevOps, Buildkite, etc.). Docker image with pre-installed CLI. |
| CI-5 | **Deployment environments** | Support for environment-specific variable overrides (dev, staging, prod). Environment promotion workflows. |
| CI-6 | **Rollback support** | Ability to revert to a previous dashboard version via CLI or API. Version history queryable. |

### 4.6 Terraform & Pulumi Providers (P1 — High Priority)

**Rationale:** Terraform is the de facto standard for infrastructure management. Every major observability vendor has a provider.

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| TF-1 | **Terraform provider for OpenSearch Dashboards** | Resources: `opensearch_dashboard`, `opensearch_visualization`, `opensearch_index_pattern`, `opensearch_saved_search`. Data sources for reading existing resources. |
| TF-2 | **Drift detection** | Terraform plan correctly identifies differences between state and deployed resources. |
| TF-3 | **Import support** | `terraform import` for existing dashboards to bring them under Terraform management. |
| TF-4 | **Schema-based validation** | Terraform validates resource attributes at plan time using the published schema. |
| TF-5 | **Pulumi provider** | Multi-language Pulumi provider (TypeScript, Python, Go, C#, Java) bridged from Terraform provider or native. |

### 4.7 Observability-as-Code — Beyond Dashboards (P2 — Medium Priority)

**Rationale:** Grafana is expanding to alerting-as-code and SLO-as-code. Datadog and Dynatrace already manage alerts, SLOs, and synthetics as code. This is the direction the market is heading.

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| OAC-1 | **Alerting-as-code** | Define monitor and alert rules as code (SDK, CLI, Terraform). Includes conditions, thresholds, notification channels. |
| OAC-2 | **Anomaly detection-as-code** | Programmatically configure anomaly detection rules for OpenSearch metrics. |
| OAC-3 | **Data source configuration-as-code** | Define and manage data source connections (OpenSearch clusters, Prometheus endpoints, etc.) as code resources. |
| OAC-4 | **Index pattern management-as-code** | Create and manage index patterns, field mappings, and scripted fields programmatically. |
| OAC-5 | **Saved query / saved search-as-code** | Define reusable queries and saved searches as code artifacts. |
| OAC-6 | **Access control-as-code** | Manage workspace permissions, tenant configurations, and resource-level access as code (integrates with OpenSearch Security plugin). |

### 4.8 Developer Experience (P0 — Must Have)

**Rationale:** The DaC workflow must be delightful. Poor DX will drive customers to competitors.

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| DX-1 | **Comprehensive documentation** | Getting-started guide, SDK API reference, CLI reference, cookbook with common patterns, migration guide from manual workflows. |
| DX-2 | **Example repository** | Public GitHub repo with example DaC projects in each supported language. CI/CD pipeline examples. |
| DX-3 | **IDE support** | JSON Schema for IDE autocompletion in VS Code, IntelliJ. SDK type definitions provide inline documentation. |
| DX-4 | **Local preview** | `osdctl preview` command renders a dashboard locally without deploying. Hot-reload on file changes. |
| DX-5 | **Error messages** | Actionable, human-readable error messages with file/line references and fix suggestions. |
| DX-6 | **Dashboard template gallery** | Curated library of reusable dashboard templates (Kubernetes monitoring, application performance, log analysis, security) available as SDK packages. |
| DX-7 | **Migration tooling** | Automated conversion from existing manual dashboards to SDK code in the user's chosen language. `osdctl convert --from-instance --language python`. |

---

## 5. Prioritized Roadmap (Recommended)

### Phase 1 — Foundation (Q2-Q3 2026)

**Goal:** Extend the Saved Objects API and ship the TypeScript SDK. Enable early adopters.

- Typed schemas and validation endpoint on Saved Objects API (API-1, API-2)
- Git-diff-friendly export format (API-3)
- Optimistic concurrency control (API-5)
- TypeScript SDK with builder pattern (SDK-1)
- CLI: `build`, `validate`, `apply`, `pull` commands (CLI-1 through CLI-7)
- Documentation and example repo (DX-1, DX-2)

### Phase 2 — Multi-Language & GitOps (Q3-Q4 2026)

**Goal:** Reach parity with Perses. Ship Python + Go SDKs and Git workflows.

- Python SDK (SDK-2)
- Go SDK (SDK-3)
- SDK auto-generation pipeline (SDK-5)
- Git Sync — bi-directional GitHub integration (GIT-1, GIT-2)
- GitHub Actions library (CI-1)
- CLI: `diff`, `lint`, `convert` commands (CLI-4, CLI-8, CLI-10)
- Local preview (DX-4)

### Phase 3 — Infrastructure-as-Code (Q1 2027)

**Goal:** Reach parity with Grafana/Datadog on IaC. Ship Terraform provider.

- Terraform provider (TF-1 through TF-4)
- Pulumi provider (TF-5)
- Java SDK (SDK-4)
- GitLab CI / Jenkins templates (CI-2, CI-3)
- PR preview rendering (GIT-3)
- Dashboard template gallery (DX-6)

### Phase 4 — Full Observability-as-Code (Q2-Q3 2027)

**Goal:** Differentiate. Go beyond dashboards to full observability lifecycle management.

- Alerting-as-code (OAC-1)
- Data source configuration-as-code (OAC-3)
- Access control-as-code (OAC-6)
- Anomaly detection-as-code (OAC-2)
- Migration tooling: instance-to-code conversion (DX-7)
- Webhook-driven GitOps (GIT-4)

---

## 6. Competitive Differentiation Opportunities

### 6.1 Open-Source First, No Lock-In

Unlike Grafana (which gates Git Sync and advanced features behind Cloud/Enterprise), OpenSearch Dashboards can ship **all DaC features in the open-source distribution**. This is a massive differentiator for cost-conscious organizations and the open-source community.

### 6.2 OpenSearch-Native Query Integration

SDKs should provide **first-class OpenSearch query builders** — DQL, PPL, and SQL query construction with autocompletion and validation. No competitor offers deep query-language integration in their DaC SDKs.

### 6.3 Multi-Format Dashboard Compatibility

Ship a `convert` command that imports **Grafana JSON dashboards** into OpenSearch Dashboards format. Lower the migration barrier for organizations moving from Grafana to OpenSearch. Also support Perses format import for CNCF ecosystem alignment.

### 6.4 Security-as-Code Integration

Leverage OpenSearch's security plugin to offer **fine-grained access control-as-code** — define who can view/edit which dashboards, tenants, and workspaces via the same as-code workflow. No competitor integrates security policies this deeply into their DaC story.

### 6.5 AI-Assisted Dashboard Generation

Integrate with LLMs to offer `osdctl generate --prompt "Create a Kubernetes pod monitoring dashboard for my production cluster"`. Generate SDK code, not just JSON — giving customers a starting point they can version-control and iterate on.

### 6.6 Plugin SDK for Community Extensions

Follow Perses' model: provide an **SDK extension point** so visualization plugin authors can ship typed builders for their plugins. Grows the ecosystem without central bottleneck.

---

## 7. Success Metrics

| Metric | Target (12 months post-launch) |
|---|---|
| SDK downloads (npm + PyPI + Go modules) | 10,000+ monthly |
| CLI installs | 5,000+ monthly |
| Terraform provider installs | 2,000+ monthly |
| Dashboards managed via as-code workflows | 20% of new dashboards in active deployments |
| GitHub Actions workflow runs | 1,000+ monthly |
| Customer NPS for DaC feature | 50+ |
| Grafana-to-OpenSearch dashboard conversions | 500+ monthly |

---

## 8. Key Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Schema instability delays SDK adoption | High | Build typed schemas incrementally on top of existing Saved Objects structure. Use `v1beta1` for early feedback before stabilizing. Existing API continues to work unchanged. |
| Low community contribution to SDKs | Medium | Auto-generate SDKs from schema to reduce maintenance burden. Start with TypeScript (largest user base). |
| Grafana Git Sync moves to GA before our launch | Medium | Differentiate on open-source availability and OpenSearch-native features rather than racing on Git Sync. |
| Terraform provider maintenance burden | Medium | Use Terraform Plugin Framework for auto-generation. Align resources with versioned API for consistency. |
| Enterprise customers need features faster than roadmap | Medium | Prioritize CLI + TypeScript SDK in Phase 1 to unblock immediate automation needs. |

---

## 9. Open Questions

1. **Schema evolution**: How do we version the typed schemas layered on top of Saved Objects? Do we use path-based versioning (`dashboard/v1`) or header-based? How do we handle schema migrations when the underlying Saved Objects structure changes?

2. **CUE support**: Perses uses CUE as their primary schema language. Should we support CUE as an SDK language, or focus on general-purpose languages (TS, Python, Go, Java)?

3. **Saved Objects API surface**: Which new endpoints (validation, diff, bulk_apply) should be added as extensions to the existing Saved Objects API vs. as a separate API namespace? How do we keep the Saved Objects API backward-compatible while adding these capabilities?

4. **CNCF alignment**: Should we contribute to / build on Perses rather than building from scratch? Perses is CNCF-sandbox and vendor-neutral by design.

5. **Multi-tenancy**: How should as-code workflows interact with OpenSearch Dashboards workspaces and multi-tenant configurations? Should labels/annotations be workspace-scoped?

6. **ndjson compatibility**: The new Git-diff-friendly format will differ from existing ndjson exports. What is the migration path for customers with existing ndjson-based automation?

---

## Appendix A: Competitive Feature Matrix

| Feature | OpenSearch (Current) | OpenSearch (Proposed) | Grafana 12 | Perses | Datadog | Dynatrace |
|---|---|---|---|---|---|---|
| Typed Resource API | Saved Objects (untyped) | P0 (extend Saved Objects) | v1beta1 (new API) | Yes | Yes | Yes |
| Multi-Language SDK | None | P0 (TS, Py, Go, Java) | Go, Java, PHP, Py, TS | CUE, Go | None (API-only) | None (YAML) |
| CLI Tool | None | P0 | grafanactl | percli | datadog-ci | Monaco |
| Git Sync (native) | None | P1 | Experimental | No (GitOps via CI) | No | No |
| Terraform Provider | None | P1 | Yes (mature) | No | Yes (mature) | Yes |
| Pulumi Provider | None | P1 | Yes | No | Yes | No |
| GitHub Actions | None | P1 | Via CLI | Yes (official) | Yes | Via Monaco |
| Dashboard Schema v2 | None | P0 | Experimental | N/A (native) | N/A | N/A |
| Alerting-as-Code | None | P2 | Planned | No | Yes | Yes |
| SLO-as-Code | None | P2 | Planned | No | Yes | Yes |
| Validation/Linting | None | P0 | Via CLI | Via percli | Via API | Via Monaco |
| Local Preview | None | P1 | Via SDK | No | No | No |
| Dashboard Conversion | None | P1 | N/A | No | No | No |
| Open Source (full) | Yes | Yes | Partial (gated) | Yes | No | No |

---

## Appendix B: Reference Implementations

- **Perses CLI Actions**: https://github.com/perses/cli-actions
- **Perses Go SDK**: `github.com/perses/perses/go-sdk`
- **Perses CUE SDK**: `github.com/perses/perses/cue/dac-utils`
- **Grafana Foundation SDK**: https://github.com/grafana/grafana-foundation-sdk
- **Grafana grafanactl**: Part of Grafana 12 distribution
- **Grafonnet (Jsonnet)**: https://github.com/grafana/grafonnet
- **Terraform Grafana Provider**: https://registry.terraform.io/providers/grafana/grafana
- **Terraform Datadog Provider**: https://registry.terraform.io/providers/DataDog/datadog
- **Dynatrace Monaco**: https://github.com/Dynatrace/dynatrace-configuration-as-code
