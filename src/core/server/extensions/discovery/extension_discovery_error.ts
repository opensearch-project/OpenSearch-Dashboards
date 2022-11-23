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

/** @internal */
export enum ExtensionDiscoveryErrorType {
  IncompatibleVersion = 'incompatible-version',
  InvalidSearchPath = 'invalid-search-path',
  InvalidExtensionPath = 'invalid-extension-path',
  InvalidManifest = 'invalid-manifest',
  MissingManifest = 'missing-manifest',
}

/** @internal */
export class ExtensionDiscoveryError extends Error {
  public static incompatibleVersion(path: string, cause: Error) {
    return new ExtensionDiscoveryError(
      ExtensionDiscoveryErrorType.IncompatibleVersion,
      path,
      cause
    );
  }

  public static invalidSearchPath(path: string, cause: Error) {
    return new ExtensionDiscoveryError(ExtensionDiscoveryErrorType.InvalidSearchPath, path, cause);
  }

  public static invalidExtensionPath(path: string, cause: Error) {
    return new ExtensionDiscoveryError(
      ExtensionDiscoveryErrorType.InvalidExtensionPath,
      path,
      cause
    );
  }

  public static invalidManifest(path: string, cause: Error) {
    return new ExtensionDiscoveryError(ExtensionDiscoveryErrorType.InvalidManifest, path, cause);
  }

  public static missingManifest(path: string, cause: Error) {
    return new ExtensionDiscoveryError(ExtensionDiscoveryErrorType.MissingManifest, path, cause);
  }

  /**
   * @param type Type of the discovery error (invalid directory, invalid manifest etc.)
   * @param path Path at which discovery error occurred.
   * @param cause "Raw" error object that caused discovery error.
   */
  constructor(
    public readonly type: ExtensionDiscoveryErrorType,
    public readonly path: string,
    public readonly cause: Error
  ) {
    super(`${cause.message} (${type}, ${path})`);

    // Set the prototype explicitly, see:
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, ExtensionDiscoveryError.prototype);
  }
}
