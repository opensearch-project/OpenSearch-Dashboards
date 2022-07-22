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

require('../src/setup_node_env');

var args = require('yargs').argv;
var generateCryptoMaterials = require('../src/plugins/credential_management/server/crypto/crypto_cli');

generateCryptoMaterials(args.path, args.keyName, args.keyNamespace);
