import { SavedObjectsType } from "opensearch-dashboards/server";

export const dataSourceSavedObjectType: SavedObjectsType = {
  name: 'data-source',
  hidden: false,
  namespaceType: 'single',
  management: {
    defaultSearchField: 'title',
    importableAndExportable: true,
    getTitle(obj) {
      return obj.attributes.title;
    },
    getEditUrl(obj) {
      return `/management/opensearch-dashboards/dataSources/${encodeURIComponent(
        obj.id
      )}`;
    },
    getInAppUrl(obj) {
      return {
        path: `/app/management/opensearch-dashboards/dataSources/${encodeURIComponent(
          obj.id
        )}`,
        uiCapabilitiesPath: 'management.opensearchDashboards.dataSources',
      };
    },
  },
  mappings: {
    dynamic: false,
    properties: {
      title: { type: 'text' },
      // type: { type: 'keyword' },
      endpoint: {
        properties: {
          authType: { type: 'keyword' },
          url:  { type: 'keyword', index: false, doc_values: false },
          credentials: { properties: {} },
        }
      }
    }
  }
}