/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capabilities } from '../../../../core/public';

/**
 * The data connections experience of the data sources pages: one table for every connection, in
 * place of the OpenSearch connections and Direct query connections tabs, and a Create data
 * connection page with a card per type. A plugin turns it on for the sessions it chooses with
 * `registerDataConnectionsExperience` during setup; without a registration, the pages keep their
 * earlier layout.
 */
export interface DataConnectionsExperience {
  /**
   * Whether the session gets the experience. Called with the session's capabilities when the data
   * sources app mounts. Anything but `true`, or a throw, means off: the pages keep their earlier
   * layout.
   */
  isEnabled: (capabilities: Capabilities) => boolean;
  /**
   * Plain text shown under the type cards of the Create data connection page, and in its empty
   * state, for example where the sources that have no card are added.
   */
  createPageNote?: string;
  /**
   * Leaves the built-in types (OpenSearch, Amazon S3, Prometheus) off the Create data connection
   * page, for an app that adds those sources elsewhere. Defaults to false: with
   * `dataSource.canManage`, the page shows the built-in types above the flows' cards.
   */
  hideBuiltInTypes?: boolean;
}

/**
 * Whether the registered experience is on for the session. Fails closed: no registration, an answer
 * other than `true`, or a throw (logged) means off.
 */
export const isDataConnectionsExperienceEnabled = (
  experience: DataConnectionsExperience | undefined,
  capabilities: Partial<Capabilities> | undefined
): boolean => {
  if (!experience || !capabilities) {
    return false;
  }
  try {
    return experience.isEnabled(capabilities as Capabilities) === true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Data connections experience: isEnabled failed', e);
    return false;
  }
};
