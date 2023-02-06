import { X509Certificate } from 'crypto';
import { XMLParser } from 'fast-xml-parser';
import { jwtKey } from '../../../../../common'
import { SamlAuthentication } from '../saml_auth';
import { SAMLResponse } from './SAMLResponse';
// import { jsonwebtoken } from 'jsonwebtoken';

export class AuthToken {
    
    token: any;
    jwt: any;

    constructor(samlResponse: SAMLResponse) {
        this.jwt = require('jsonwebtoken');
        const jwtExpirySeconds = "1d";
        const user = {
            "cgliu@amazon.com": "123456",
        }
        this.token = this.jwt.sign({ username: "cgliu@amazon.com" }, jwtKey, {
            algorithm: "HS256",
            expiresIn: jwtExpirySeconds,
        })
        // this.token = "bearer " + this.token;
    }
}