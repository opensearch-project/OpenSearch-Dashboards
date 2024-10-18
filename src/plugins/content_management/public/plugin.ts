/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, CoreStart, Plugin, PluginInitializerContext } from '../../../core/public';

import { ContentManagementService } from './services';
import {
  ContentManagementPluginSetup,
  ContentManagementPluginSetupDependencies,
  ContentManagementPluginStart,
  ContentManagementPluginStartDependencies,
  RenderOptions,
} from './types';
import { CUSTOM_CONTENT_EMBEDDABLE } from './components/custom_content_embeddable';
import { CustomContentEmbeddableFactoryDefinition } from './components/custom_content_embeddable_factory';
import { CARD_CONTAINER } from './components/card_container/card_container';
import { CardContainerFactoryDefinition } from './components/card_container/card_container_factory';
import { CARD_EMBEDDABLE } from './components/card_container/card_embeddable';
import { CardEmbeddableFactoryDefinition } from './components/card_container/card_embeddable_factory';
import { renderPage } from './app';

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
      CUSTOM_CONTENT_EMBEDDABLE,
      new CustomContentEmbeddableFactoryDefinition()
    );

    deps.embeddable.registerEmbeddableFactory(
      CARD_EMBEDDABLE,
      new CardEmbeddableFactoryDefinition()
    );

    deps.embeddable.registerEmbeddableFactory(
      CARD_CONTAINER,
      new CardContainerFactoryDefinition(async () => ({
        embeddableServices: (await core.getStartServices())[1].embeddable,
      }))
    );

    return {
      registerPage: this.contentManagementService.registerPage,
    };
  }

  public start(core: CoreStart, depsStart: ContentManagementPluginStartDependencies) {
    this.contentManagementService.start();
    return {
      registerContentProvider: this.contentManagementService.registerContentProvider,
      updatePageSection: this.contentManagementService.updatePageSection,
      getPage: (id: string) => this.contentManagementService.getPage(id),
      renderPage: (id: string, renderOptions?: RenderOptions) => {
        const page = this.contentManagementService.getPage(id);
        if (page) {
          return renderPage({
            page,
            embeddable: depsStart.embeddable,
            savedObjectsClient: core.savedObjects.client,
            renderOptions,
          });
        }
      },
    };
  }
}
