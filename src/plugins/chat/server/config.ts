/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: false }),
  agUiUrl: schema.maybe(schema.string()),
  forwardCredentials: schema.boolean({ defaultValue: false }),
  mlCommonsAgentId: schema.maybe(schema.string()),
  observabilityAgentId: schema.maybe(schema.string()),
  // How the chat gets a data source when none resolves for a message (data sources exist, but
  // there is no page, conversation or default data source):
  // - picker: the chat shows the data source picker before sending.
  // - agent: the message is sent without a data source, and the agent asks the user for one
  //   (ask_user) only when the request needs data. Use it only with an agent that can run
  //   without a data source id.
  unresolvedDataSource: schema.oneOf([schema.literal('picker'), schema.literal('agent')], {
    defaultValue: 'picker',
  }),
});

export type ChatConfigType = TypeOf<typeof configSchema>;
