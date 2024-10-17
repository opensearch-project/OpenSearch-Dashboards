/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart } from '../../../../../core/public';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';

type Core = Pick<CoreStart, 'application' | 'http'>;

export const navigateToWorkspacePageWithUseCase = (
  application: Core['application'],
  useCaseTitle: string,
  appId: string
) => {
  const newUrl = application.getUrlForApp(appId, { absolute: true });
  if (newUrl) {
    const url = new URL(newUrl);
    url.hash = `/?useCase=${useCaseTitle}`;
    application.navigateToUrl(url.toString());
  }
};

export const navigateToAppWithinWorkspace = (
  { application, http }: Core,
  workspaceId: string,
  appId: string,
  hash?: string
) => {
  const newUrl = formatUrlWithWorkspaceId(
    application.getUrlForApp(appId, {
      absolute: true,
    }),
    workspaceId,
    http.basePath
  );
  if (newUrl) {
    const url = new URL(newUrl);
    if (hash) {
      url.hash = hash;
    }
    application.navigateToUrl(url.toString());
  }
};
