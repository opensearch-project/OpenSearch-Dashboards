/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { HTMLAttributes } from 'react';
import { t } from '../../../shared/i18n/t';

export const ViewInsightsButton: React.FC<HTMLAttributes<HTMLButtonElement>> = (props) => (
  <button
    className="osd-resetFocusState osd:font-medium osd:text-link-default osd:hover:text-link-hover osd:cursor-pointer"
    aria-label={t('buttons.viewInsights')}
    title={t('buttons.viewInsights')}
    {...props}
  >
    {t(`buttons.viewInsights`)}
  </button>
);
