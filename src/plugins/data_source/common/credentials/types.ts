/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectAttributes } from 'src/core/types';

/**
 * Each credential's materials type. For the time being, only username/password pairs are supported.
 */
export enum CredentialMaterialsType {
  UsernamePasswordType = 'username_password',
}

export interface CredentialSavedObjectAttributes extends SavedObjectAttributes {
  title: string;
  credentialMaterials: CredentialMaterials;
  description?: string;
}

export interface CredentialMaterials extends SavedObjectAttributes {
  credentialMaterialsType: CredentialMaterialsType;
  credentialMaterialsContent: UsernamePasswordTypedContent;
}

export interface UsernamePasswordTypedContent extends SavedObjectAttributes {
  username: string;
  password: string;
}
