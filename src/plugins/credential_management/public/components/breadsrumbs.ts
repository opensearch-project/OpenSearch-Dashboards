import { i18n } from '@osd/i18n';

export function getListBreadcrumbs() {
  return [
    {
      text: i18n.translate('credentialManagement.credentials.listBreadcrumb', {
        defaultMessage: 'Credentials',
      }),
      href: `/`,
    },
  ];
}

export function getCreateBreadcrumbs() {
  return [
    ...getListBreadcrumbs(),
    {
      text: i18n.translate('credentialManagement.credentials.createBreadcrumb', {
        defaultMessage: 'Create credentials',
      }),
      href: `/create`,
    },
  ];
}
