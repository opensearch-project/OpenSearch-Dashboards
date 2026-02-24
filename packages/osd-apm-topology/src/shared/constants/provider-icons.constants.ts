/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AnthropicIcon,
  OpenAiIcon,
  AwsBedrockIcon,
  AzureIcon,
  GoogleIcon,
  CohereIcon,
  MistralIcon,
  MetaIcon,
} from '../resources/providers';

/**
 * Maps OTel `gen_ai.system` values to provider SVG icon URLs.
 * Supports both dot-notation (e.g., `aws.bedrock`) and underscore-notation (e.g., `aws_bedrock`).
 */
export const PROVIDER_ICONS: Record<string, string> = {
  anthropic: AnthropicIcon,
  openai: OpenAiIcon,
  aws_bedrock: AwsBedrockIcon,
  'aws.bedrock': AwsBedrockIcon,
  az_ai_inference: AzureIcon,
  'az.ai.inference': AzureIcon,
  gcp_vertex_ai: GoogleIcon,
  'gcp.vertex_ai': GoogleIcon,
  cohere: CohereIcon,
  mistral: MistralIcon,
  meta: MetaIcon,
};

export function getProviderIcon(provider?: string): string | undefined {
  if (!provider) return undefined;
  return PROVIDER_ICONS[provider] ?? PROVIDER_ICONS[provider.replace(/[._]/g, '_')];
}
