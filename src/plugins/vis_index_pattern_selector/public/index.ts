/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

export {
  VisIndexPatternSelector,
  VisIndexPatternSelectorProps,
} from './components/vis_index_pattern_selector';

/** dummy plugin, we just want VisIndexPatternSelector to have its own bundle */
export function plugin() {
  return new (class VisIndexPatternSelector {
    setup() {}
    start() {}
  })();
}
