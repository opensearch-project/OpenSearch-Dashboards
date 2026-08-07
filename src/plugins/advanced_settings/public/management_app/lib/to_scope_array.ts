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

import { UiSettingScope } from '../../../../../core/public';

/**
 * Normalizes a setting's `scope` (which may be a single scope, an array, or undefined)
 * into an array of scopes. An unscoped setting is treated as GLOBAL.
 */
export const toScopeArray = (scope?: UiSettingScope | UiSettingScope[]): UiSettingScope[] =>
  scope ? ([] as UiSettingScope[]).concat(scope) : [UiSettingScope.GLOBAL];
