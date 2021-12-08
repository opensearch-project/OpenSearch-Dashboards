# Development certificates

OpenSearch Dashboards includes several development certificates to enable easy setup of TLS-encrypted communications with OpenSearch.

_Note: these certificates should **never** be used in production._

## Certificate information

Certificates and keys are provided in multiple formats. These can be used by other packages to set up a new OpenSearch Stack with OpenSearch Dashboards and OpenSearch. The Certificate Authority (CA) private key is intentionally omitted from this package.

### PEM 

* `ca.crt` -- A [PEM-formatted](https://tools.ietf.org/html/rfc1421) [X.509](https://tools.ietf.org/html/rfc5280) certificate that is used as a CA.
* `opensearch.crt` -- A PEM-formatted X.509 certificate and public key for OpenSearch.
* `opensearch.key` -- A PEM-formatted [PKCS #1](https://tools.ietf.org/html/rfc8017) private key for OpenSearch.
* `opensearch_dashboards.crt` -- A PEM-formatted X.509 certificate and public key for OpenSearch Dashboards.
* `opensearch_dashboards.key` -- A PEM-formatted PKCS #1 private key for OpenSearch Dashboards.

### PKCS #12

* `opensearch.p12` -- A [PKCS #12](https://tools.ietf.org/html/rfc7292) encrypted key store / trust store that contains `ca.crt`, `opensearch.crt`, and a [PKCS #8](https://tools.ietf.org/html/rfc5208) encrypted version of `opensearch.key`.
* `opensearch_dashboards.p12` -- A PKCS #12 encrypted key store / trust store that contains `ca.crt`, `opensearch_dashboards.crt`, and a PKCS #8 encrypted version of `opensearch_dashboards.key`.

The password used for both of these is "storepass". Other copies are also provided for testing purposes:

* `opensearch_emptypassword.p12` -- The same PKCS #12 key store, encrypted with an empty password.
* `opensearch_nopassword.p12` -- The same PKCS #12 key store, not encrypted with a password.

## Certificate generation

[OpenSearch Self-signed Certificates](https://opensearch.org/docs/latest/security-plugin/configuration/generate-certificates/) and [OpenSSL](https://www.openssl.org/) were used to generate these certificates. The following commands were used from the root directory of OpenSearch:

```
# Generate the PKCS #12 keystore for a CA, valid for 50 years
bin/opensearch-certutil ca -days 18250 --pass castorepass

# Generate the PKCS #12 keystore for OpenSearch and sign it with the CA
bin/opensearch-certutil cert -days 18250 --ca opensearch-stack-ca.p12 --ca-pass castorepass --name opensearch --dns localhost --pass storepass

# Generate the PKCS #12 keystore for OpenSearch Dashboards and sign it with the CA
bin/opensearch-certutil cert -days 18250 --ca opensearch-stack-ca.p12 --ca-pass castorepass --name opensearch-dashboards --dns localhost --pass storepass

# Copy the PKCS #12 keystore for OpenSearch with an empty password
openssl pkcs12 -in opensearch.p12 -nodes -passin pass:"storepass" -passout pass:"" | openssl pkcs12 -export -out opensearch_emptypassword.p12 -passout pass:""

# Manually create "opensearch_nopassword.p12" -- this can be done on macOS by importing the P12 key store into the Keychain and exporting it again

# Extract the PEM-formatted X.509 certificate for the CA
openssl pkcs12 -in opensearch.p12 -out ca.crt -cacerts -passin pass:"storepass" -passout pass:

# Extract the PEM-formatted PKCS #1 private key for OpenSearch
openssl pkcs12 -in opensearch.p12 -nocerts -passin pass:"storepass" -passout pass:"keypass" | openssl rsa -passin pass:keypass -out opensearch.key

# Extract the PEM-formatted X.509 certificate for OpenSearch
openssl pkcs12 -in opensearch.p12 -out opensearch.crt -clcerts -passin pass:"storepass" -passout pass:

# Extract the PEM-formatted PKCS #1 private key for OpenSearch Dashboards
openssl pkcs12 -in opensearch_dashboards.p12 -nocerts -passin pass:"storepass" -passout pass:"keypass" | openssl rsa -passin pass:keypass -out opensearch_dashboards.key

# Extract the PEM-formatted X.509 certificate for OpenSearch Dashboards
openssl pkcs12 -in opensearch_dashboards.p12 -out opensearch_dashboards.crt -clcerts -passin pass:"storepass" -passout pass:
```
