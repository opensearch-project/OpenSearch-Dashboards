import { CoreStart } from 'opensearch-dashboards/public';

import { ContentManagementService } from './services';
import { EmbeddableSetup, EmbeddableStart } from '../../embeddable/public';

export interface ContentManagementPluginSetup {
  registerPage: ContentManagementService['registerPage'];
  getPage: ContentManagementService['getPage'];
}
export interface ContentManagementPluginStart {
  getPage: ContentManagementService['getPage'];
}

export type ContentManagementPluginStartDependencies = {
  embeddable: EmbeddableStart;
};

export type ContentManagementPluginSetupDependencies = {
  embeddable: EmbeddableSetup;
};

export type ContentServices = CoreStart & ContentManagementPluginStartDependencies;
