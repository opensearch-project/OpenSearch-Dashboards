/**
 * Forces object to be partial type for mocking tests
 *
 * SHOULD NOT BE USED OUTSIDE OF TESTS!!!
 *
 * @param obj partial object type
 */
export const forcedType = <T extends object>(obj: Partial<T>): T => {
  return obj as T;
};
