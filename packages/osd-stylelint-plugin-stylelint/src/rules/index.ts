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

import noCustomColors from './no_custom_colors';
import noModifyingGlobalSelectors from './no_modifying_global_selectors';
import noRestrictedProperties from './no_restricted_properties';
import noRestrictedValues from './no_restricted_values';

// eslint-disable-next-line import/no-default-export
export default {
  no_custom_colors: noCustomColors,
  no_modifying_global_selectors: noModifyingGlobalSelectors,
  no_restricted_properties: noRestrictedProperties,
  no_restricted_values: noRestrictedValues,
};
