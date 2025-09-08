import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: false }),
});

export type AiChatbotConfigType = TypeOf<typeof configSchema>;