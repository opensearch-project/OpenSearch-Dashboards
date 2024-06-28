/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AppMountParameters,
  AppNavLinkStatus,
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
} from '../../../core/public';
import { i18n } from '@osd/i18n';

import { ContentManagementService } from './services';
import {
  ContentManagementPluginSetup,
  ContentManagementPluginSetupDependencies,
  ContentManagementPluginStart,
  ContentManagementPluginStartDependencies,
} from './types';
import { CUSTOM_CONTENT_RENDER } from './components/custom_content_embeddable';
import { CustomContentEmbeddableFactoryDefinition } from './components/custom_content_embeddable_factory';

export class ContentManagementPublicPlugin
  implements
    Plugin<
      ContentManagementPluginSetup,
      ContentManagementPluginStart,
      {},
      ContentManagementPluginStartDependencies
    > {
  private readonly contentManagementService = new ContentManagementService();

  constructor(private readonly initializerContext: PluginInitializerContext) {}

  public setup(
    core: CoreSetup<ContentManagementPluginStartDependencies>,
    deps: ContentManagementPluginSetupDependencies
  ) {
    this.contentManagementService.setup();

    deps.embeddable.registerEmbeddableFactory(
      CUSTOM_CONTENT_RENDER,
      new CustomContentEmbeddableFactoryDefinition()
    );

    core.application.register({
      id: 'contents',
      title: 'Contents',
      navLinkStatus: AppNavLinkStatus.hidden,
      mount: async (params: AppMountParameters) => {
        const [coreStart, depsStart] = await core.getStartServices();
        console.log(depsStart);
        const { renderApp } = await import('./app');
        const pages = [...this.contentManagementService.pages.values()];

        return renderApp(
          {
            pages,
            coreStart,
            depsStart,
            params,
          },
          params.element
        );
      },
    });

    return {
      registerPage: this.contentManagementService.registerPage,
      getPage: this.contentManagementService.getPage,
    };
  }

  public start(core: CoreStart) {
    this.contentManagementService.start();
    return {
      getPage: this.contentManagementService.getPage,
    };
  }
}
