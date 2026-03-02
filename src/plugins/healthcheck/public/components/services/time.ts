/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { IUiSettingsClient } from 'opensearch-dashboards/public/ui_settings';

export function getTimezone(uiSettings: IUiSettingsClient) {
  if (uiSettings.isDefault('dateFormat:tz')) {
    const detectedTimezone = moment.tz.guess();
    if (detectedTimezone) return detectedTimezone;
    else return moment().format('Z');
  } else {
    return uiSettings.get('dateFormat:tz', 'Browser');
  }
}

/**
 * Format the date in the frontend side to the configuration of the dashboard
 * @param uiSettings UISettings client
 * @param date date
 * @returns formatted date
 */
export function formatDate(uiSettings: IUiSettingsClient, date: string) {
  const dateFormat = uiSettings.get('dateFormat');
  const timezone = getTimezone(uiSettings);

  const momentDate = moment(date);
  momentDate.tz(timezone);
  return momentDate.format(dateFormat);
}
