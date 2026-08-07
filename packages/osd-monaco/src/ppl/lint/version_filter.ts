/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import semver from 'semver';
import { LintSeverity } from './diagnostic';
import { CatalogEntry } from './types';

/** Latest engine version the catalog was verified against. */
export const OSD_KNOWN_VERSION = '3.8.0';

function coerce(version: string): string | null {
  return semver.coerce(version)?.version ?? null;
}

/**
 * Decide whether a rule applies to a data source's version and engine.
 *
 * Known version: below `minVersion` or above a declared `maxVersion` skips, and
 * a Calcite-only rule needs `isCalcite === true`.
 *
 * Unknown version (absent, blank, or unparseable) is deliberately conservative,
 * because version-string quality says nothing about which engine is running:
 * a Calcite-only rule still needs a positive engine signal, and a rule with a
 * readable floor is suppressed at error severity since the floor cannot be shown
 * to be met.
 *
 * `catalogSeverity` is the rule's shipped severity. It must stay separate from
 * `rule.severity`, which callers pass already merged with the user's per-rule
 * override — deciding suppression from an editable value would let a severity
 * downgrade re-enable the very false positive the unknown-version policy exists
 * to prevent.
 */
export function appliesTo(
  rule: CatalogEntry,
  dataSourceVersion: string | undefined,
  isCalcite: boolean | undefined,
  knownVersion: string = OSD_KNOWN_VERSION,
  catalogSeverity: LintSeverity = rule.severity
): boolean {
  const { appliesTo: predicate } = rule;
  const isCalciteGated = predicate.engine === 'calcite';

  // Undefined, blank, and unparseable versions are one case: the cluster's
  // version is unknown. Folding them here (rather than recursing for the
  // unparseable form) keeps the engine and floor policies below impossible to
  // bypass — the recursive form used to re-enter a branch that ignored
  // `isCalcite`, so a version string of 'main' leaked rules that '2.19.0'
  // correctly suppressed.
  const coercedVersion = dataSourceVersion ? coerce(dataSourceVersion) : null;

  if (!coercedVersion) {
    // A Calcite-only rule needs a positive engine signal. `false` and unknown
    // both mean "cannot prove Calcite is running", so neither may run.
    if (isCalciteGated && isCalcite !== true) {
      return false;
    }

    // A rule with a floor cannot prove the cluster meets it. Suppress at error
    // severity only, so an unreadable version never produces a red squiggle
    // while warning-level coverage survives. Keyed on the CATALOG severity: the
    // merged severity is user-editable, and keying on it would let a downgrade
    // re-enable the false error this check exists to prevent.
    //
    // A floor semver cannot read is no evidence either way, so it is ignored
    // here exactly as the known-version path below ignores it.
    if (catalogSeverity === 'error' && predicate.minVersion && coerce(predicate.minVersion)) {
      return false;
    }

    if (predicate.maxVersion !== undefined) {
      const effectiveMax = predicate.maxVersion;
      const coercedMax = coerce(effectiveMax);
      const coercedKnown = coerce(knownVersion);
      if (coercedMax && coercedKnown && semver.gt(coercedKnown, coercedMax)) {
        return false;
      }
    }
    return true;
  }

  if (isCalciteGated && isCalcite !== true) {
    return false;
  }

  if (predicate.minVersion) {
    const coercedMin = coerce(predicate.minVersion);
    if (coercedMin && semver.lt(coercedVersion, coercedMin)) {
      return false;
    }
  }

  if (predicate.maxVersion !== undefined) {
    const coercedMax = coerce(predicate.maxVersion);
    if (coercedMax && semver.gt(coercedVersion, coercedMax)) {
      return false;
    }
  }

  return true;
}
