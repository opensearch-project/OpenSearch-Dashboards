/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WizardServices } from '../..';

export const getSavedWizardVis = async (services: WizardServices, wizardVisId?: string) => {
  const { savedWizardLoader } = services;
  if (!savedWizardLoader) {
    return {};
  }
  const savedWizardVis = await savedWizardLoader.get(wizardVisId);

  return savedWizardVis;
};
