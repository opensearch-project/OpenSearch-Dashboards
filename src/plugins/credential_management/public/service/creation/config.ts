/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: Clean up this file after creation UX added
import { i18n } from '@osd/i18n';

const credentialTypeName = i18n.translate('credentialManagement.editCredential.defaultTypeName', {
  defaultMessage: 'credential',
});

const credentialButtonText = i18n.translate(
  'credentialManagement.editCredential.defaultButtonText',
  { defaultMessage: 'Standard credential' }
);

export type UrlHandler = (url: string) => void;

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
