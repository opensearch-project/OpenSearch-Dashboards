/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const PLUGIN_ID = 'opensearchDashboardsSecurity';
export const PLUGIN_NAME = 'security-dashboards-plugin';

export const APP_ID_LOGIN = 'login';

export const API_PREFIX = '/api/v1';
export const CONFIGURATION_API_PREFIX = 'configuration';
export const API_ENDPOINT_AUTHINFO = API_PREFIX + '/auth/authinfo';
export const API_ENDPOINT_AUTHTYPE = API_PREFIX + '/auth/type';
export const LOGIN_PAGE_URI = '/app/' + APP_ID_LOGIN;
export const API_AUTH_LOGIN = '/auth/login';
export const API_AUTH_LOGOUT = '/auth/logout';
export const OPENID_AUTH_LOGIN = '/auth/openid/login';
export const SAML_AUTH_LOGIN = '/auth/saml/login';
export const ANONYMOUS_AUTH_LOGIN = '/auth/anonymous';
export const SAML_AUTH_LOGIN_WITH_FRAGMENT = '/auth/saml/captureUrlFragment?nextUrl=%2F';

export const OPENID_AUTH_LOGOUT = '/auth/openid/logout';
export const SAML_AUTH_LOGOUT = '/auth/saml/logout';
export const ANONYMOUS_AUTH_LOGOUT = '/auth/anonymous/logout';

export const AUTH_HEADER_NAME = 'authorization';
export const AUTH_GRANT_TYPE = 'authorization_code';
export const AUTH_RESPONSE_TYPE = 'code';

export const jwtKey = '6aff3042-1327-4f3d-82f0-40a157ac4464';

export const idpCert =
  'MIIDzzCCAregAwIBAgIUKizt/svOXO4USLQ3spS2Bn507LYwDQYJKoZIhvcNAQEFBQAwQTEMMAoGA1UECgwDQVdTMRUwEwYDVQQLDAxPbmVMb2dpbiBJZFAxGjAYBgNVBAMMEU9uZUxvZ2luIEFjY291bnQgMB4XDTIzMDExMzIwMTQzNVoXDTI4MDExMzIwMTQzNVowQTEMMAoGA1UECgwDQVdTMRUwEwYDVQQLDAxPbmVMb2dpbiBJZFAxGjAYBgNVBAMMEU9uZUxvZ2luIEFjY291bnQgMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwTX1daRM90aJmDCWTL3Iuj4GvK2nHRNZoLP9dzscbFJNMIQEXdyREHSVnFO18KWDfwX3gOgvcuijJUk+r5XCf1oJueUNhme/Q8eSHQe1TOhOVPXuI9BxMyPupeKfmFelIylTNvUoCQo2A/dJURRN2rjz4pOoCqadOlgm2So//J8I/JiZVO6S1YleAjWY5VYOMJMq8QKBBMKkmxok+reA36lmvi2JtUZWpZVo62XVcjP9+uOONyXo7O3VEu8Vwezex2sXFyCm699G1aeRCtHQ3yKmhf0Rm0D+RgZKnG+9i6aeJFTXluBqOrz6CtXtW0SV2NKIeK36EcMH1unlG4/VMwIDAQABo4G+MIG7MAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFKsWx05elVPbItGUYA3SBXVehP7VMHwGA1UdIwR1MHOAFKsWx05elVPbItGUYA3SBXVehP7VoUWkQzBBMQwwCgYDVQQKDANBV1MxFTATBgNVBAsMDE9uZUxvZ2luIElkUDEaMBgGA1UEAwwRT25lTG9naW4gQWNjb3VudCCCFCos7f7LzlzuFEi0N7KUtgZ+dOy2MA4GA1UdDwEB/wQEAwIHgDANBgkqhkiG9w0BAQUFAAOCAQEAh0Kg8BQrOuWO30A6Qj+VL2Ke0/Y96hgdjYxk4zcIwZcIxfb5U733ftF2H0r8RKBYNrWpEmPwa4RnaTqwRaY/pahZ7kznzgMVUMhT9QZe4uNDLu5HgzAuOdhpYk2qv6+GYqcbMNtKPEtTjp0/KwMntgBkn9dPBSiydqojtwh0i2e2rhFh4gBDvuXdHZCcOWCKYm24IOoEI41Q4JIu1jAk6LM3jErcZdx+Lqa9rvSn6jdC6/jwhR1anqqLU9qGIjN99640z/JIOdK8wPei2veLpZbKIDtG/iaSNkdrFhEE1WNXTnnPImQNVgvIT9QdyOLLdzuQ25G3Qraj47JEMm0Xmw==';

export enum AuthType {
  BASIC = 'basicauth',
  OIDC = 'oidc',
  JWT = 'jwt',
  SAML = 'saml',
  PROXY = 'proxy',
  ANONYMOUS = 'anonymous',
}
