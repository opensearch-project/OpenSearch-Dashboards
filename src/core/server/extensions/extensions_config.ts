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

import { schema, TypeOf } from '@osd/config-schema';
import { Env } from '../config';

export type ExtensionsConfigType = TypeOf<typeof config.schema>;

export const config = {
  path: 'extensions',
  schema: schema.object({
    initialize: schema.boolean({ defaultValue: true }),

    /**
     * Defines an array of directories where another extension should be loaded from.
     */
    paths: schema.arrayOf(schema.string(), { defaultValue: [] }),
  }),
};

/** @internal */
export class ExtensionsConfig {
  /**
   * Indicates whether or not extensions should be initialized.
   */
  public readonly initialize: boolean;

  /**
   * Defines directories that we should scan for the extension subdirectories.
   */
  public readonly extensionSearchPaths: readonly string[];

  /**
   * Defines directories where an additional extension exists.
   */
  public readonly additionalExtensionPaths: readonly string[];

  constructor(rawConfig: ExtensionsConfigType, env: Env) {
    this.initialize = rawConfig.initialize;
    this.extensionSearchPaths = env.extensionSearchPaths;
    this.additionalExtensionPaths = rawConfig.paths;
  }
}
