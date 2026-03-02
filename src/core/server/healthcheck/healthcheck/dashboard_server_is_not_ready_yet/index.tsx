/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  SERVER_NOT_READY_RESET_STYLES_ROUTE,
  SERVER_NOT_READY_SCRIPT_ROUTE,
  SERVER_NOT_READY_STYLES_ROUTE,
} from './server';

interface NotReadyServerProps {
  appName: string;
  documentationTroubleshootingLink?: string;
  serverBasePath: string;
}

const DashboardServerIsNotReadyYetComponent = (props: NotReadyServerProps) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>{props.appName}</title>
        <link
          rel="stylesheet"
          href={`${props.serverBasePath}${SERVER_NOT_READY_RESET_STYLES_ROUTE}`}
        />
        <link rel="stylesheet" href={`${props.serverBasePath}${SERVER_NOT_READY_STYLES_ROUTE}`} />
      </head>
      <body>
        <div id="root" />
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: /* javascript */ `
              window.__CONFIG = ${JSON.stringify(props)}
            `,
          }}
        />
        <script src={`${props.serverBasePath}${SERVER_NOT_READY_SCRIPT_ROUTE}`} />
      </body>
    </html>
  );
};

export const dashboardServerIsNotReadyYet = (props: NotReadyServerProps) =>
  renderToStaticMarkup(DashboardServerIsNotReadyYetComponent(props));
