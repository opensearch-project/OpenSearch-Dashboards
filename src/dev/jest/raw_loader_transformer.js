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

// Jest 28+ compatible raw file transformer (replaces jest-raw-loader@1.0.1)
module.exports = {
  process: (content) => ({ code: 'module.exports = ' + JSON.stringify(content) }),
};
