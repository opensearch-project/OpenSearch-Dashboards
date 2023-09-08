# `@osd/std` — OpenSearch Dashboards standard library

This package is a set of utilities that can be used both on server-side and client-side.

## API

#### `assertNever`

Can be used in switch statements to ensure we perform exhaustive checks.

#### `deepFreeze`

Apply `Object.freeze` to a value recursively and convert the return type to `Readonly` variant recursively.

#### `get`

Retrieve the value for the specified path of an object.

#### `getFlattenedObject`

Flatten a deeply nested object to a map of dot-separated paths, pointing to all of its primitive values and arrays.

#### `stringify` and `parse`

Drop-in replacement for `JSON.stringify` and `JSON.parse`, capable of handling long numerals and `BigInt` values.

#### `mapToObject`

Convert a map to an object.

#### `mapValuesOfMap`

Create a new `Map` populated with the results of calling a provided function on every element in the input `Map`.

#### `groupIntoMap`

Group elements of an `Array` into a `Map` based on a provided function.

#### `merge`

Deeply merge two objects, omitting undefined values, and not deeply merging arrays.

#### `pick`

Create a new `Object` of specified keys and their values from an input `Object`.

#### `withTimeout`

Apply a `timeout` duration to a `Promise` before throwing an `Error` with the provided message.

#### `firstValueFrom` and `lastValueFrom`

Get a `Promise` that resolves as soon as the first or last value arrives from an observable.

#### `unset`

Unset a (potentially nested) key from given object.

#### `modifyUrl`

Get an `Object` resulting from applying a provided function to the meaningful parts of a URL.

#### `isRelativeUrl`

Determine if a url is relative.

#### `getUrlOrigin`

Get the origin URL of a provided URL.

#### `validateObject`

Deeply validate that an `Object` does not contain any `__proto__` or `constructor.prototype` keys, or circular references.