/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCallOut, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import React from 'react';
import { PlaygroundSection } from './playground_section';

export function PlaygroundTab() {
  return (
    <>
      <EuiSpacer />
      <EuiCallOut
        title={i18n.translate('expressionsExample.tab.demo4.title', {
          defaultMessage: 'Expression Playground',
        })}
        iconType="gear"
      >
        <FormattedMessage
          id="expressionsExample.tab.demo4.description"
          defaultMessage="Use this playground to try your own expression."
        />
      </EuiCallOut>
      <EuiCallOut
        color="warning"
        iconType="help"
        title={i18n.translate('expressionsExample.tab.demo4.warning', {
          defaultMessage: 'You can only use already registered expression functions and renderers.',
        })}
      />
      <EuiSpacer />

      <PlaygroundSection
        title={i18n.translate('expressionsExample.tab.demo4.playground1.title', {
          defaultMessage: 'Run Expression',
        })}
        defaultExpression={'sleep time=2000 | square'}
      />

      <EuiSpacer />
      <PlaygroundSection
        title={i18n.translate('expressionsExample.tab.demo4.playground2.title', {
          defaultMessage: 'Render Expression',
        })}
        defaultExpression={'avatar name="OpenSearch Dashboards" size="xl"'}
        renderType
      />
    </>
  );
}
