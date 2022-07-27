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

// TODO: Clean up this file after creation UX added
import { i18n } from '@osd/i18n';
// import { MatchedItem } from '../../components/create_credential_wizard/types';

const credentialTypeName = i18n.translate(
  'credentialManagement.editCredential.defaultTypeName',
  { defaultMessage: 'credential' }
);

const credentialButtonText = i18n.translate(
  'credentialManagement.editCredential.defaultButtonText',
  { defaultMessage: 'Standard credential' }
);

// const indexPatternButtonDescription = i18n.translate(
//   'indexPatternManagement.editIndexPattern.createIndex.defaultButtonDescription',
//   { defaultMessage: 'Perform full aggregations against any data' }
// );

export type UrlHandler = (url: string) => void;

// TODO: Revisit it
export interface CredentialCreationOption {
  text: string;
  description: string;
  testSubj: string;
  onClick: () => void;
  isBeta?: boolean;
}

export class CredentialCreationConfig {
  public readonly key = 'default';

  protected type?: string;
  protected name: string;
  protected showSystemIndices: boolean;
  protected httpClient: object | null;
  protected isBeta: boolean;

  constructor({
    type = undefined,
    name = credentialTypeName,
    showSystemIndices = true,
    httpClient = null,
    isBeta = false,
  }: {
    type?: string;
    name?: string;
    showSystemIndices?: boolean;
    httpClient?: object | null;
    isBeta?: boolean;
  }) {
    this.type = type;
    this.name = name;
    this.showSystemIndices = showSystemIndices;
    this.httpClient = httpClient;
    this.isBeta = isBeta;
  }

  public getCredentialCreationOption(urlHandler: UrlHandler): CredentialCreationOption {
    return {
      text: credentialButtonText,
      description: `getCredentialCreationOption`,
      testSubj: `createStandardCredentialButton`,
      onClick: () => {
        urlHandler('/create');
      },
    };
  }
  
  public renderPrompt() {
    return null;
  }

  public getFetchForWildcardOptions() {
    return {};
  }
}
