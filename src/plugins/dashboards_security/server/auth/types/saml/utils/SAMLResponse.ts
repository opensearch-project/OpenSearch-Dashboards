/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { X509Certificate } from 'crypto';
import { XMLParser } from 'fast-xml-parser';

export class SAMLResponse {
  private acsUrl: string | undefined;
  private samlResponseDocument: any;
  private jsonObj: any;
  private cert: X509Certificate | undefined;

  constructor(request: any) {
    if (request !== null) {
      this.acsUrl = 'http://localhost:5601/_opendistro/_security/saml/acs';
      this.samlResponseDocument = request.body.SAMLResponse;
      const SAML = require('saml-encoder-decoder-js');
      const xmlParser = new XMLParser();
      SAML.decodeSamlPost(this.samlResponseDocument, (err: string | undefined, xml: any) => {
        if (err) {
          throw new Error(err);
        }
        this.jsonObj = xmlParser.parse(xml);
      });
    }
  }

  public isValid(samlResponse: SAMLResponse) {
    return true;
  }
}
