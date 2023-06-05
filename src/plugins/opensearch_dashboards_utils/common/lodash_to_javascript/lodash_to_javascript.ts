
export default function isFunction(func: string | any) {

  if (typeof func === 'string') {
    return typeof func === "function";
  } else if (Array.isArray(func)) {
    return typeof func === "function";
  } else {
    return typeof func === "function";
  }

}