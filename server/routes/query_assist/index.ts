import { SUPPORTED_LANGUAGES } from '../../../common/query_assist';

export { registerQueryAssistRoutes } from './routes';

export const AGENT_CONFIG_NAME_MAP: Record<typeof SUPPORTED_LANGUAGES[number], string> = {
  PPL: 'os_query_assist_ppl',
} as const;
