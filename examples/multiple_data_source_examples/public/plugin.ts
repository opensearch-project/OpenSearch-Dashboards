/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  CoreSetup,
  Plugin,
  AppMountParameters,
  AppNavLinkStatus,
  CoreStart,
} from '../../../src/core/public';

import {
  MultipleDataSourceExamplesPluginSetup,
  MultipleDataSourceExamplesPluginSetupDependencies,
  MultipleDataSourceExamplesPluginStart,
  MultipleDataSourceExamplesPluginStartDependencies,
} from './types';

export class MultipleDataSourceExamplesPlugin
  implements Plugin<MultipleDataSourceExamplesPluginSetup, void> {
  public setup(
    core: CoreSetup,
    {
      dataSource,
      dataSourceManagement,
      developerExamples,
    }: MultipleDataSourceExamplesPluginSetupDependencies
  ): MultipleDataSourceExamplesPluginSetup {
    core.application.register({
      id: 'multiple-data-source-example',
      title: 'Multiple Data Source Integration Examples',
      navLinkStatus: AppNavLinkStatus.hidden,
      async mount(params: AppMountParameters) {
        const { renderApp } = await import('./application');
        const [coreStart, depsStart] = await core.getStartServices();
        const { navigation } = depsStart as MultipleDataSourceExamplesPluginStartDependencies;

        return renderApp(coreStart, dataSource, dataSourceManagement, params, navigation);
      },
    });

    developerExamples.register({
      appId: 'multiple-data-source-example',
      title: i18n.translate('multipleDataSourceExample.developerExamples.title', {
        defaultMessage: 'Multiple Data Source Integration',
      }),
      description: i18n.translate('multipleDataSourceExample.developerExamples.description', {
        defaultMessage:
          'Examples showing you how plugins can integrate with multiple data source feature',
      }),
      links: [
        {
          label: 'README',
          href:
            'https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/plugins/data_source_management/README.md',
          iconType: 'logoGithub',
          target: '_blank',
          size: 's',
        },
      ],
    });

    return {};
  }

  public start(core: CoreStart): MultipleDataSourceExamplesPluginStart {
    return {};
  }

  public stop() {}
}
