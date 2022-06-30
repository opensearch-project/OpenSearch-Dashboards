import { i18n } from '@osd/i18n';
import { DataSource } from 'src/plugins/data_source_management/common';

export function getListBreadcrumbs() {
  return [
    {
      text: i18n.translate('indexPatternManagement.indexPatterns.listBreadcrumb', {
        defaultMessage: 'Data sources',
      }),
      href: `/`,
    },
  ];
}

export function getCreateBreadcrumbs() {
  return [
    ...getListBreadcrumbs(),
    {
      text: i18n.translate('indexPatternManagement.indexPatterns.createBreadcrumb', {
        defaultMessage: 'Create data source',
      }),
      href: `/create`,
    },
  ];
}

export function getEditBreadcrumbs(dataSource: DataSource) {
  return [
    ...getListBreadcrumbs(),
    {
      text: dataSource.title,
      href: `/sources/${dataSource.id}`,
    },
  ];
}

export function getEditFieldBreadcrumbs(dataSource: DataSource, fieldName: string) {
  return [
    ...getEditBreadcrumbs(dataSource),
    {
      text: fieldName,
    },
  ];
}

// export function getCreateFieldBreadcrumbs(dataSource: DataSource) {
//   return [
//     ...getEditBreadcrumbs(dataSource),
//     {
//       text: i18n.translate('indexPatternManagement.indexPatterns.createFieldBreadcrumb', {
//         defaultMessage: 'Create field',
//       }),
//     },
//   ];
// }
