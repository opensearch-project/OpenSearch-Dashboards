import { SavedObjectsType } from 'opensearch-dashboards/server';

export const dataSource: SavedObjectsType = {
  name: 'data-source',
  namespaceType: 'single',
  hidden: false,
  management: {
    icon: 'dataSourceApp',
    defaultSearchField: 'title',
    importableAndExportable: true,
    getTitle(obj) {
      return obj.attributes.title;
    },
    getEditUrl(obj) {
      return `/management/opensearch-dashboards/dataSources/sources/${encodeURIComponent(obj.id)}`;
    },
    getInAppUrl(obj) {
      return {
        path: `/app/management/opensearch-dashboards/dataSources/sources/${encodeURIComponent(
          obj.id
        )}`,
        uiCapabilitiesPath: 'management.opensearchDashboards.dataSources',
      };
    },
  },
  mappings: {
    dynamic: false,
    properties: {
      title: {
        type: 'text',
      },
      type: {
        type: 'keyword',
      },
      credientialsJSON: {
        type: 'text',
        index: false,
      },
      endpoint: {
        type: 'keyword',
        index: false,
        doc_values: false,
      },
      // todo: pending on/off flag for plugins
    },
  },
};
