/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { EuiButtonIcon } from '@elastic/eui';
import { CoreStart } from 'opensearch-dashboards/public';
import { PPLReferenceFlyout } from './ppl_reference_flyout';
import {
  OpenSearchDashboardsContextProvider,
  toMountPoint,
} from '../../../opensearch_dashboards_react/public';

export class QueryLanguageReference {
  protected coreStart!: CoreStart;
  protected overLaysService!: CoreStart['overlays'];

  constructor(private readonly startServices: Promise<[CoreStart, any, unknown]>) {
    startServices.then(([coreStart]) => {
      this.coreStart = coreStart;
      this.overLaysService = coreStart.overlays;
    });
  }

  public createPPLLanguageReference() {
    const button = (
      <EuiButtonIcon
        iconType={'iInCircle'}
        aria-label={i18n.translate('discover.queryControls.languageReference', {
          defaultMessage: `PPL language Reference`,
        })}
        onClick={() => {
          const flyoutSession = this.overLaysService!.openFlyout(
            toMountPoint(
              <OpenSearchDashboardsContextProvider services={this.coreStart}>
                <PPLReferenceFlyout
                  onClose={() => flyoutSession?.close()}
                  makeUrl={(searchId: any) => `#/view/${encodeURIComponent(searchId)}`}
                />
              </OpenSearchDashboardsContextProvider>
            )
          );
        }}
      />
    );
    return button;
  }
}
