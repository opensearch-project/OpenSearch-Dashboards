/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiAvatar, EuiAvatarProps } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { createRoot, Root } from 'react-dom/client';
import { ExpressionRenderDefinition } from '../../../../../src/plugins/expressions/public';

export interface AvatarRenderValue {
  name: string;
  size: EuiAvatarProps['size'];
}

export const avatar: ExpressionRenderDefinition<AvatarRenderValue> = {
  name: 'avatar',
  displayName: i18n.translate('expressionsExample.render.help', {
    defaultMessage: 'Render an avatar',
  }),
  reuseDomNode: true,
  render: (domNode, { name, size }, handlers) => {
    const root = createRoot(domNode);

    handlers.onDestroy(() => {
      root.unmount();
    });

    root.render(<EuiAvatar size={size} name={name} />);
    handlers.done();
  },
};
