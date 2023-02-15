/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SAML } from 'node-saml';

('use strict');

// const Saml = require('passport-saml/lib/node-saml/saml');
// const Saml = SAML

export class HapiSaml {
  saml: any;
  props: {};

  constructor(options: any) {
    console.log('!!!options');
    console.log(options);

    this.saml = null;
    this.props = {};
    this.load(options);
  }

  load(options: any) {
    if (!options.saml) {
      throw new Error('Missing options.saml');
    }

    if (!options.config && !options.config.routes) {
      throw new Error('Missing options.config.routes');
    }

    if (!options.config.routes.metadata) {
      throw new Error('Missing options.config.routes.metadata');
    }

    if (!options.config.routes.assert) {
      throw new Error('Missing options.config.routes.assert');
    }

    if (!options.config && !options.config.assertHooks.onRequest) {
      throw new Error('Missing options.config.assertHooks.onRequest');
    }

    if (!options.config && !options.config.assertHooks.onResponse) {
      throw new Error('Missing options.config.assertHooks.onResponse');
    }

    console.log('777777');

    this.saml = new SAML(options.saml);
    this.props = Object.assign({}, options.saml);
    this.props.decryptionCert = options.config.decryptionCert;
    this.props.signingCert = options.config.signingCert;
  }

  getSamlLib() {
    return this.saml;
  }
}

exports.HapiSaml = HapiSaml;
