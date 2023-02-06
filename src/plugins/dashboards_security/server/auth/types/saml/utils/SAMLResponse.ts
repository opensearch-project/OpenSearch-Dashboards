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
            const SAML = require("saml-encoder-decoder-js");
            const xmlParser = new XMLParser();
            // TODO: 
            // - Validate SAML Response 
            // - Set the SAML Response expiry in cookie
            // - Consider how identiy info updates in IDP are synced with SP(Just in time/Real Time updates)
            SAML.decodeSamlPost(this.samlResponseDocument, (err: string | undefined, xml: any) => {
                if (err) {
                    throw new Error(err);
                }
                this.jsonObj = xmlParser.parse(xml);
            });
            // this.cert = new X509Certificate("fs.readFileSync('public-cert.pem')");
        }
    }

    public isValid(samlResponse: SAMLResponse) {
        // TODO:
        // - validateDestination()
        // - this.settings.getIdpx509cert()
        // - expiry - getSessionNotOnOrAfter()
        // - Validate responseInResponseTo()
        // - If IDP sets getWantNameIdEncrypted to true, validate if NameID is encrypted.
        // - Validate if issuer is not empty and equal to the IDP Entity ID
        // - If IDP sets getWantAssertionsSigned to true, validate if Assertion is signed.
        // - Validate if there's a signature
        return true;
    }



}