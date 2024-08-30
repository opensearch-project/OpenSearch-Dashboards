/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButtonIcon } from '@elastic/eui';
import { CoreStart } from 'opensearch-dashboards/public';
import { DataPublicPluginStart, LanguageConfig } from 'src/plugins/data/public';
import {
  OpenSearchDashboardsContextProvider,
  toMountPoint,
} from '../../../opensearch_dashboards_react/public';
import { ReferenceFlyout } from './components';

export interface QueryLanguageReferenceDeps {
  startServices: Promise<[CoreStart, any, unknown]>;
}

export class QueryLanguageReference {
  protected coreStart!: CoreStart;
  protected overlaysService!: CoreStart['overlays'];
  protected queryService!: DataPublicPluginStart['query'];

  constructor(deps: QueryLanguageReferenceDeps) {
    deps.startServices.then(([coreStart, depsStart]) => {
      this.coreStart = coreStart;
      this.overlaysService = coreStart.overlays;
      this.queryService = depsStart.data.query;
    });
  }

  public createReference(languageId: string) {
    const language = this.queryService.queryString.getLanguageService().getLanguage(languageId);
    if (!language) return;

    const button = (
      <EuiButtonIcon
        iconType="iInCircle"
        aria-label={`${language.title} Language Reference`}
        onClick={() => this.openFlyout(language)}
      />
    );
    return button;
  }

  private openFlyout(language: LanguageConfig) {
    const flyoutSession = this.overlaysService!.openFlyout(
      toMountPoint(
        <OpenSearchDashboardsContextProvider services={this.coreStart}>
          <ReferenceFlyout language={language} onClose={() => flyoutSession?.close()} />
        </OpenSearchDashboardsContextProvider>
      )
    );
  }
}
