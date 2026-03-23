/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { schema } from '@osd/config-schema';
import { IRouter } from '../../http';

interface SchemaProperty {
  type?: string;
  required?: boolean;
  properties?: Record<string, SchemaProperty>;
  items?: SchemaProperty;
  enum?: unknown[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
}

interface JsonSchema {
  type?: string;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

interface ValidationError {
  path: string;
  message: string;
  schemaPath: string;
}

/**
 * Registry that holds JSON schemas for saved object types.
 * In a full implementation, this would be populated by type registrations.
 */
const schemaRegistry: Record<string, Record<string, JsonSchema>> = {};

export function registerSchema(type: string, version: string, jsonSchema: JsonSchema) {
  if (!schemaRegistry[type]) {
    schemaRegistry[type] = {};
  }
  schemaRegistry[type][version] = jsonSchema;
}

export function getSchema(type: string, version?: string): JsonSchema | undefined {
  const typeSchemas = schemaRegistry[type];
  if (!typeSchemas) {
    return undefined;
  }
  if (version) {
    return typeSchemas[version];
  }
  // Return the latest version
  const versions = Object.keys(typeSchemas).sort();
  return versions.length > 0 ? typeSchemas[versions[versions.length - 1]] : undefined;
}

export function getAllSchemas(): Record<string, Record<string, JsonSchema>> {
  return schemaRegistry;
}

function validateValueAgainstProperty(
  value: unknown,
  prop: SchemaProperty,
  path: string,
  schemaPath: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (prop.type) {
    let typeValid = false;
    switch (prop.type) {
      case 'string':
        typeValid = typeof value === 'string';
        break;
      case 'number':
      case 'integer':
        typeValid = typeof value === 'number';
        break;
      case 'boolean':
        typeValid = typeof value === 'boolean';
        break;
      case 'array':
        typeValid = Array.isArray(value);
        break;
      case 'object':
        typeValid = typeof value === 'object' && value !== null && !Array.isArray(value);
        break;
      default:
        typeValid = true;
    }

    if (!typeValid) {
      errors.push({
        path,
        message: `Expected type ${prop.type} but got ${typeof value}`,
        schemaPath: `${schemaPath}/type`,
      });
      return errors;
    }
  }

  if (prop.enum && !prop.enum.includes(value)) {
    errors.push({
      path,
      message: `Value must be one of: ${prop.enum.join(', ')}`,
      schemaPath: `${schemaPath}/enum`,
    });
  }

  if (prop.type === 'string' && typeof value === 'string') {
    if (prop.minLength !== undefined && value.length < prop.minLength) {
      errors.push({
        path,
        message: `String must be at least ${prop.minLength} characters`,
        schemaPath: `${schemaPath}/minLength`,
      });
    }
    if (prop.maxLength !== undefined && value.length > prop.maxLength) {
      errors.push({
        path,
        message: `String must be at most ${prop.maxLength} characters`,
        schemaPath: `${schemaPath}/maxLength`,
      });
    }
    if (prop.pattern !== undefined) {
      const regex = new RegExp(prop.pattern);
      if (!regex.test(value)) {
        errors.push({
          path,
          message: `String must match pattern: ${prop.pattern}`,
          schemaPath: `${schemaPath}/pattern`,
        });
      }
    }
  }

  if ((prop.type === 'number' || prop.type === 'integer') && typeof value === 'number') {
    if (prop.minimum !== undefined && value < prop.minimum) {
      errors.push({
        path,
        message: `Value must be >= ${prop.minimum}`,
        schemaPath: `${schemaPath}/minimum`,
      });
    }
    if (prop.maximum !== undefined && value > prop.maximum) {
      errors.push({
        path,
        message: `Value must be <= ${prop.maximum}`,
        schemaPath: `${schemaPath}/maximum`,
      });
    }
  }

  if (prop.type === 'array' && Array.isArray(value) && prop.items) {
    value.forEach((item, index) => {
      errors.push(
        ...validateValueAgainstProperty(
          item,
          prop.items!,
          `${path}[${index}]`,
          `${schemaPath}/items`
        )
      );
    });
  }

  if (prop.type === 'object' && prop.properties && typeof value === 'object' && value !== null) {
    errors.push(
      ...validateAttributesAgainstSchema(
        value as Record<string, unknown>,
        {
          type: 'object',
          properties: prop.properties,
          required: Object.entries(prop.properties)
            .filter(([, p]) => p.required)
            .map(([key]) => key),
        },
        path,
        schemaPath
      )
    );
  }

  return errors;
}

function validateAttributesAgainstSchema(
  attributes: Record<string, unknown>,
  jsonSchema: JsonSchema,
  basePath: string = '',
  baseSchemaPath: string = ''
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check required fields
  if (jsonSchema.required) {
    for (const requiredField of jsonSchema.required) {
      if (attributes[requiredField] === undefined) {
        errors.push({
          path: basePath ? `${basePath}.${requiredField}` : requiredField,
          message: `Required field "${requiredField}" is missing`,
          schemaPath: `${baseSchemaPath}/required`,
        });
      }
    }
  }

  // Validate each property
  if (jsonSchema.properties) {
    for (const [key, value] of Object.entries(attributes)) {
      const propSchema = jsonSchema.properties[key];
      if (propSchema) {
        const propPath = basePath ? `${basePath}.${key}` : key;
        const propSchemaPath = `${baseSchemaPath}/properties/${key}`;
        errors.push(...validateValueAgainstProperty(value, propSchema, propPath, propSchemaPath));
      } else if (jsonSchema.additionalProperties === false) {
        errors.push({
          path: basePath ? `${basePath}.${key}` : key,
          message: `Unknown field "${key}" is not allowed`,
          schemaPath: `${baseSchemaPath}/additionalProperties`,
        });
      }
    }
  }

  return errors;
}

export const registerValidateRoute = (router: IRouter) => {
  router.post(
    {
      path: '/_validate',
      validate: {
        query: schema.object({
          mode: schema.oneOf([schema.literal('schema'), schema.literal('full')], {
            defaultValue: 'schema',
          }),
        }),
        body: schema.object({
          type: schema.string(),
          attributes: schema.recordOf(schema.string(), schema.any()),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { type, attributes } = req.body;
      const { mode } = req.query;

      // Check that the type exists in the registry
      const typeRegistry = context.core.savedObjects.typeRegistry;
      const registeredType = typeRegistry.getType(type);
      if (!registeredType) {
        return res.badRequest({
          body: {
            message: `Unknown saved object type: ${type}`,
          },
        });
      }

      const jsonSchema = getSchema(type);
      const errors: ValidationError[] = [];
      const warnings: string[] = [];

      if (jsonSchema) {
        errors.push(...validateAttributesAgainstSchema(attributes, jsonSchema));
      } else {
        warnings.push(`No JSON Schema registered for type "${type}". Skipping schema validation.`);
      }

      // In 'full' mode, verify that referenced saved objects exist
      if (mode === 'full') {
        const savedObjectsClient = context.core.savedObjects.client;
        // Scan attributes for potential references (fields ending in Id or with type/id patterns)
        const referenceKeys = Object.keys(attributes).filter(
          (key) => key.endsWith('Id') || key.endsWith('_id')
        );
        for (const key of referenceKeys) {
          const refId = attributes[key];
          if (typeof refId === 'string') {
            try {
              // Attempt to find the object - this is a best-effort check
              await savedObjectsClient.get(type, refId);
            } catch (e) {
              warnings.push(`Referenced object "${key}": "${refId}" may not exist`);
            }
          }
        }
      }

      const valid = errors.length === 0;

      return res.ok({
        body: {
          valid,
          ...(errors.length > 0 ? { errors } : {}),
          ...(warnings.length > 0 ? { warnings } : {}),
        },
      });
    })
  );
};
