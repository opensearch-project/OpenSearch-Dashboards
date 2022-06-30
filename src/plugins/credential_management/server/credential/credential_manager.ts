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

import { OpenSearchDashboardsRequest } from 'opensearch-dashboards/server';
import { CryptoCli } from '../crypto';

interface Credential {
    readonly credential_name: string,
    readonly credential_type: string,
    readonly credential_material: BasicAuthCredentialMaterial | AWSIAMCredentialMaterial,
}

interface BasicAuthCredentialMaterial{
    readonly user_name: string
    readonly password: string
}

interface AWSIAMCredentialMaterial {
    readonly encrypted_aws_iam_credential: string
}

// TODO: Refactor handler, add logger, etc
export async function createHandler(request: OpenSearchDashboardsRequest) {
    const cryptoCli = CryptoCli.getInstance()
    if (request.body.credential_type == 'basic_auth') {
        const basicAuthCredentialMaterial: BasicAuthCredentialMaterial = {
            user_name: request.body.basic_auth_credential_JSON.user_name,
            password: await cryptoCli.encrypt(request.body.basic_auth_credential_JSON.password),
        }
        return {
            credential_name: request.body.credential_name,
            credential_type: request.body.credential_type,
            credential_material: basicAuthCredentialMaterial
        }
    } else if (request.body.credential_type == 'aws_iam_credential') {
        const aWSIAMCredentialMaterial: AWSIAMCredentialMaterial = {
            encrypted_aws_iam_credential: await cryptoCli.encrypt(request.body.basic_auth_credential_JSON.password)
        }
        return {
            credential_name: request.body.credential_name,
            credential_type: request.body.credential_type,
            credential_material: aWSIAMCredentialMaterial
        }
    }
}