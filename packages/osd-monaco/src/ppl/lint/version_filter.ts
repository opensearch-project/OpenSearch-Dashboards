/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import semver from 'semver';
import { CatalogEntry } from './types';

/** Latest engine version the catalog was verified against. Not the OSD version. */
export const OSD_KNOWN_VERSION = '3.7.0';

function coerce(version: string): string | null {
  const coerced = semver.coerce(version);
  return coerced ? coerced.version : null;
}

export function appliesTo(
  rule: CatalogEntry,
  dataSourceVersion: string | undefined,
  isCalcite: boolean | undefined,
  knownVersion: string = OSD_KNOWN_VERSION
): boolean {
  const { appliesTo: predicate, severity } = rule;
  const isCalciteGated = predicate.engine === 'calcite';

  if (dataSourceVersion === undefined) {
    if (isCalciteGated) {
      // Can't confirm Calcite: error-severity self-suppresses, warning runs.
      return severity !== 'error';
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

  const coercedVersion = coerce(dataSourceVersion);
  if (!coercedVersion) {
    return appliesTo(rule, undefined, isCalcite, knownVersion);
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
