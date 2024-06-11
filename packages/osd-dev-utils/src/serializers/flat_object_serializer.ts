/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const walk = (value: any, path: string[] = [], collector: string[] = []) => {
  let objValue;
  switch (Object.prototype.toString.call(value)) {
    case '[object Map]':
    case '[object WeakMap]':
      // Turn into an Object so it can be iterated
      objValue = Object.fromEntries(value);
      break;

    case '[object Set]':
    case '[object WeakSet]':
      // Turn into an Array so it can be iterated
      objValue = Array.from(value);
      break;

    case '[object Object]':
    case '[object Array]':
      objValue = value;
      break;

    case '[object RegExp]':
    case '[object Function]':
    case '[object Date]':
    case '[object Boolean]':
    case '[object Number]':
    case '[object Symbol]':
    case '[object Error]':
      collector.push(`${path.join('.')} = ${value.toString()}`);
      break;

    case '[object Null]':
      collector.push(`${path.join('.')} = null`);
      break;

    case '[object Undefined]':
      collector.push(`${path.join('.')} = undefined`);
      break;

    case '[object String]':
      collector.push(`${path.join('.')} = ${JSON.stringify(value)}`);
      break;

    case '[object BigInt]':
      collector.push(`${path.join('.')} = ${value.toString()}n`);
      break;

    default:
      // if it is a TypedArray, turn it into an array
      if (value instanceof Object.getPrototypeOf(Uint8Array)) {
        objValue = Array.from(value);
      }
  }

  // If objValue is set, it is an Array or Object that can be iterated; else bail.
  if (!objValue) return collector;

  if (Array.isArray(objValue)) {
    objValue.forEach((v, i) => {
      walk(v, [...path, i.toString()], collector);
    });
  } else {
    // eslint-disable-next-line guard-for-in
    for (const key in objValue) {
      walk(objValue[key], [...path, key], collector);
    }
  }

  return collector;
};

/**
 * The serializer flattens objects into dotified key-value pairs, each on a line, and
 * sorts them to aid in diff-ing.
 *
 * Example:
 * { K: ["a", "b", { X: 1n }], Y: 1}
 *
 * Serialized:
 * K.0 = "a"
 * K.1 = "b"
 * K.2.X = 1n
 * Y = 1
 */
export const flatObjectSerializer = {
  test: (value: any) =>
    ['[object Object]', '[object Array]'].includes(Object.prototype.toString.call(value)),
  serialize: (value: any) => walk(value).sort().join('\n'),
};
