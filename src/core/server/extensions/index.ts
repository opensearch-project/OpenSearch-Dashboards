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

export {
  ExtensionsService,
  ExtensionsServiceSetup,
  ExtensionsServiceStart,
  UiExtensions,
} from './extensions_service';
export { config } from './extensions_config';
/** @internal */
export { isNewPlatformExtension } from './discovery';
export * from './types';
