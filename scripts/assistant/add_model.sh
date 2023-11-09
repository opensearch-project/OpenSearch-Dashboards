#!/usr/bin/env bash
set -e

function add_model() {
  [ -z "$ACCESS_KEY_ID" ] && ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
  [ -z "$SECRET_ACCESS_KEY" ] && SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
  [ -z "$SESSION_TOKEN" ] && SESSION_TOKEN=${AWS_SESSION_TOKEN}

  ENDPOINT=https://admin:${CREDENTIAL}@${BIND_ADDRESS}:${BIND_PORT}

  curl -s -k "${ENDPOINT}/_cluster/settings" -XPUT -H 'Content-Type: application/json' -d '{
    "persistent" : {
      "plugins.ml_commons.trusted_connector_endpoints_regex":
      [ "^https://runtime\\.sagemaker\\..*[a-z0-9-]\\.amazonaws\\.com/.*$",
        "^https://api\\.openai\\.com/.*$",
        "^https://api\\.cohere\\.ai/.*$",
        "^https://bedrock-runtime\\.[a-z0-9-]+\\.amazonaws\\.com/.*$"
      ]
    }
  }' | jq

  # shellcheck disable=2016
  CONNECTOR=$(curl -s -k "${ENDPOINT}/_plugins/_ml/connectors/_create" -XPOST -H 'Content-Type: application/json' -d '{
    "name": "BedRock test claude Connector",
    "description": "The connector to BedRock service for claude model",
    "version": 1,
    "protocol": "aws_sigv4",
    "parameters": {
        "region": "'$REGION'",
        "service_name": "bedrock",
        "anthropic_version": "bedrock-2023-05-31",
        "endpoint": "bedrock.'$REGION'.amazonaws.com",
        "auth": "Sig_V4",
        "content_type": "application/json"
    },
    "credential": {
      "access_key": "'$ACCESS_KEY_ID'",
      "secret_key": "'$SECRET_ACCESS_KEY'",
      "session_token": "'$SESSION_TOKEN'"
    },
    "actions": [
      {
        "action_type": "predict",
        "method": "POST",
        "url": "https://bedrock-runtime.'"$REGION"'.amazonaws.com/model/anthropic.claude-v1/invoke",
        "headers": {
          "content-type": "application/json",
          "x-amz-content-sha256": "required"
        },
        "request_body": "{\"prompt\":\"${parameters.prompt}\", \"max_tokens_to_sample\":${parameters.max_tokens_to_sample}, \"temperature\":${parameters.temperature},  \"anthropic_version\":\"${parameters.anthropic_version}\" }"
      }
    ]
  }' | jq -r '.connector_id')
  echo "❗connector: ${CONNECTOR}"

  GROUP=$(curl -s -k "${ENDPOINT}/_plugins/_ml/model_groups/_register" -XPOST -H 'Content-Type: application/json' -d '{
      "name": "test_model_group_public",
      "description": "This is a public model group"
  }' | jq | grep -oP '(?<=ID: )(.+)(?=\.)|(?<=model_group_id": ")(.+)(?=",)' | head -n 1)
  echo "❗group: ${GROUP}"

  EMBEDDINGS_TASK=$(curl -s -k "${ENDPOINT}/_plugins/_ml/models/_register?deploy=true" -XPOST -H 'Content-Type: application/json' -d '{
      "name": "huggingface/sentence-transformers/all-mpnet-base-v2",
      "version": "1.0.1",
      "model_group_id": "'$GROUP'",
      "model_format": "TORCH_SCRIPT"
    }' | jq -r '.task_id')
  echo "❗embeddings_task: ${EMBEDDINGS_TASK}"

  MODEL=$(curl -s -k "${ENDPOINT}/_plugins/_ml/models/_register?deploy=true" -XPOST -H 'Content-Type: application/json' -d '{
      "name": "Claude model on bedrock",
      "model_group_id": "'$GROUP'",
      "function_name": "remote",
      "version": "1.0.0",
      "connector_id": "'$CONNECTOR'",
      "description": "test model"
    }' | jq -r '.model_id')

  echo "❗model: ${MODEL}"
  sleep 40
  EMBEDDINGS_MODEL=$(curl -s -k "${ENDPOINT}/_plugins/_ml/tasks/${EMBEDDINGS_TASK}" | jq -r '.model_id')
  echo "❗embeddings_model: ${EMBEDDINGS_MODEL}"

  curl -s -k "${ENDPOINT}/.chat-assistant-config/_doc/model-config" -XPOST -H 'Content-Type: application/json' -d '{
    "model_type":"claude_bedrock",
    "embeddings_model_id":"'$EMBEDDINGS_MODEL'",
    "model_id":"'$MODEL'"
  }' | jq
}
