/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "../../packages/osd-optimizer/target/worker/entry_point_creator.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../../node_modules/css-loader/dist/cjs.js?!../../node_modules/postcss-loader/dist/cjs.js?!../../node_modules/comment-stripper/index.js?!../../node_modules/sass-loader/dist/cjs.js?!./public/index.scss?v7dark":
/*!*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/css-loader/dist/cjs.js??ref--6-oneOf-0-1!/home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/postcss-loader/dist/cjs.js??ref--6-oneOf-0-2!/home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/comment-stripper??ref--6-oneOf-0-3!/home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/sass-loader/dist/cjs.js??ref--6-oneOf-0-4!./public/index.scss?v7dark ***!
  \*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "../../node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default.a);
// Module
___CSS_LOADER_EXPORT___.push([module.i, "/*!\n * SPDX-License-Identifier: Apache-2.0\n *\n * The OpenSearch Contributors require contributions made to\n * this file be licensed under the Apache-2.0 license or a\n * compatible open source license.\n *\n * Modifications Copyright OpenSearch Contributors. See\n * GitHub history for details.\n */\n\n\n", "",{"version":3,"sources":["webpack://./public/index.scss"],"names":[],"mappings":"AAAA;;;;;;;;;EASE","sourcesContent":["/*!\n * SPDX-License-Identifier: Apache-2.0\n *\n * The OpenSearch Contributors require contributions made to\n * this file be licensed under the Apache-2.0 license or a\n * compatible open source license.\n *\n * Modifications Copyright OpenSearch Contributors. See\n * GitHub history for details.\n */\n\n\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ __webpack_exports__["default"] = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "../../node_modules/css-loader/dist/cjs.js?!../../node_modules/postcss-loader/dist/cjs.js?!../../node_modules/comment-stripper/index.js?!../../node_modules/sass-loader/dist/cjs.js?!./public/index.scss?v7light":
/*!**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/css-loader/dist/cjs.js??ref--6-oneOf-1-1!/home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/postcss-loader/dist/cjs.js??ref--6-oneOf-1-2!/home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/comment-stripper??ref--6-oneOf-1-3!/home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/sass-loader/dist/cjs.js??ref--6-oneOf-1-4!./public/index.scss?v7light ***!
  \**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "../../node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default.a);
// Module
___CSS_LOADER_EXPORT___.push([module.i, "/*!\n * SPDX-License-Identifier: Apache-2.0\n *\n * The OpenSearch Contributors require contributions made to\n * this file be licensed under the Apache-2.0 license or a\n * compatible open source license.\n *\n * Modifications Copyright OpenSearch Contributors. See\n * GitHub history for details.\n */\n\n\n", "",{"version":3,"sources":["webpack://./public/index.scss"],"names":[],"mappings":"AAAA;;;;;;;;;EASE","sourcesContent":["/*!\n * SPDX-License-Identifier: Apache-2.0\n *\n * The OpenSearch Contributors require contributions made to\n * this file be licensed under the Apache-2.0 license or a\n * compatible open source license.\n *\n * Modifications Copyright OpenSearch Contributors. See\n * GitHub history for details.\n */\n\n\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ __webpack_exports__["default"] = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "../../node_modules/css-loader/dist/cjs.js?!../../node_modules/postcss-loader/dist/cjs.js?!../../node_modules/comment-stripper/index.js?!../../node_modules/sass-loader/dist/cjs.js?!./public/index.scss?v8dark":
/*!*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/css-loader/dist/cjs.js??ref--6-oneOf-2-1!/home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/postcss-loader/dist/cjs.js??ref--6-oneOf-2-2!/home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/comment-stripper??ref--6-oneOf-2-3!/home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/sass-loader/dist/cjs.js??ref--6-oneOf-2-4!./public/index.scss?v8dark ***!
  \*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "../../node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default.a);
// Module
___CSS_LOADER_EXPORT___.push([module.i, "/*!\n * SPDX-License-Identifier: Apache-2.0\n *\n * The OpenSearch Contributors require contributions made to\n * this file be licensed under the Apache-2.0 license or a\n * compatible open source license.\n *\n * Modifications Copyright OpenSearch Contributors. See\n * GitHub history for details.\n */\n\n\n", "",{"version":3,"sources":["webpack://./public/index.scss"],"names":[],"mappings":"AAAA;;;;;;;;;EASE","sourcesContent":["/*!\n * SPDX-License-Identifier: Apache-2.0\n *\n * The OpenSearch Contributors require contributions made to\n * this file be licensed under the Apache-2.0 license or a\n * compatible open source license.\n *\n * Modifications Copyright OpenSearch Contributors. See\n * GitHub history for details.\n */\n\n\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ __webpack_exports__["default"] = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "../../node_modules/css-loader/dist/cjs.js?!../../node_modules/postcss-loader/dist/cjs.js?!../../node_modules/comment-stripper/index.js?!../../node_modules/sass-loader/dist/cjs.js?!./public/index.scss?v8light":
/*!**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/css-loader/dist/cjs.js??ref--6-oneOf-3-1!/home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/postcss-loader/dist/cjs.js??ref--6-oneOf-3-2!/home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/comment-stripper??ref--6-oneOf-3-3!/home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/sass-loader/dist/cjs.js??ref--6-oneOf-3-4!./public/index.scss?v8light ***!
  \**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "../../node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default.a);
// Module
___CSS_LOADER_EXPORT___.push([module.i, "/*!\n * SPDX-License-Identifier: Apache-2.0\n *\n * The OpenSearch Contributors require contributions made to\n * this file be licensed under the Apache-2.0 license or a\n * compatible open source license.\n *\n * Modifications Copyright OpenSearch Contributors. See\n * GitHub history for details.\n */\n\n\n", "",{"version":3,"sources":["webpack://./public/index.scss"],"names":[],"mappings":"AAAA;;;;;;;;;EASE","sourcesContent":["/*!\n * SPDX-License-Identifier: Apache-2.0\n *\n * The OpenSearch Contributors require contributions made to\n * this file be licensed under the Apache-2.0 license or a\n * compatible open source license.\n *\n * Modifications Copyright OpenSearch Contributors. See\n * GitHub history for details.\n */\n\n\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ __webpack_exports__["default"] = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "../../node_modules/css-loader/dist/runtime/api.js":
/*!**********************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/css-loader/dist/runtime/api.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
// eslint-disable-next-line func-names
module.exports = function (cssWithMappingToString) {
  var list = []; // return the list of modules as css string

  list.toString = function toString() {
    return this.map(function (item) {
      var content = cssWithMappingToString(item);

      if (item[2]) {
        return "@media ".concat(item[2], " {").concat(content, "}");
      }

      return content;
    }).join("");
  }; // import a list of modules into the list
  // eslint-disable-next-line func-names


  list.i = function (modules, mediaQuery, dedupe) {
    if (typeof modules === "string") {
      // eslint-disable-next-line no-param-reassign
      modules = [[null, modules, ""]];
    }

    var alreadyImportedModules = {};

    if (dedupe) {
      for (var i = 0; i < this.length; i++) {
        // eslint-disable-next-line prefer-destructuring
        var id = this[i][0];

        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }

    for (var _i = 0; _i < modules.length; _i++) {
      var item = [].concat(modules[_i]);

      if (dedupe && alreadyImportedModules[item[0]]) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (mediaQuery) {
        if (!item[2]) {
          item[2] = mediaQuery;
        } else {
          item[2] = "".concat(mediaQuery, " and ").concat(item[2]);
        }
      }

      list.push(item);
    }
  };

  return list;
};

/***/ }),

/***/ "../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js":
/*!*****************************************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/css-loader/dist/runtime/cssWithMappingToString.js ***!
  \*****************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr && (typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]); if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

module.exports = function cssWithMappingToString(item) {
  var _item = _slicedToArray(item, 4),
      content = _item[1],
      cssMapping = _item[3];

  if (!cssMapping) {
    return content;
  }

  if (typeof btoa === "function") {
    // eslint-disable-next-line no-undef
    var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(cssMapping))));
    var data = "sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(base64);
    var sourceMapping = "/*# ".concat(data, " */");
    var sourceURLs = cssMapping.sources.map(function (source) {
      return "/*# sourceURL=".concat(cssMapping.sourceRoot || "").concat(source, " */");
    });
    return [content].concat(sourceURLs).concat([sourceMapping]).join("\n");
  }

  return [content].join("\n");
};

/***/ }),

/***/ "../../node_modules/json11/dist/umd/index.js":
/*!****************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/json11/dist/umd/index.js ***!
  \****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

(function(global, factory) {
   true ? factory(exports) : undefined;
})(this, function(exports2) {
  "use strict";
  const Space_Separator = /[\u1680\u2000-\u200A\u202F\u205F\u3000]/;
  const ID_Start = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE83\uDE86-\uDE89\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]/;
  const ID_Continue = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u09FC\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9-\u0AFF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D00-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF9\u1D00-\u1DF9\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDE00-\uDE3E\uDE47\uDE50-\uDE83\uDE86-\uDE99\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD47\uDD50-\uDD59]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4A\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/;
  const unicode = { Space_Separator, ID_Start, ID_Continue };
  const isSpaceSeparator = (c) => {
    return typeof c === "string" && unicode.Space_Separator.test(c);
  };
  const isIdStartChar = (c) => {
    return typeof c === "string" && (c >= "a" && c <= "z" || c >= "A" && c <= "Z" || c === "$" || c === "_" || unicode.ID_Start.test(c));
  };
  const isIdContinueChar = (c) => {
    return typeof c === "string" && (c >= "a" && c <= "z" || c >= "A" && c <= "Z" || c >= "0" && c <= "9" || c === "$" || c === "_" || c === "‌" || c === "‍" || unicode.ID_Continue.test(c));
  };
  const isDigit = (c) => {
    return typeof c === "string" && /[0-9]/.test(c);
  };
  const isInteger = (s) => {
    return typeof s === "string" && !/[^0-9]/.test(s);
  };
  const isHex = (s) => {
    return typeof s === "string" && /0x[0-9a-f]+$/i.test(s);
  };
  const isHexDigit = (c) => {
    return typeof c === "string" && /[0-9a-f]/i.test(c);
  };
  function parse(text, reviver, options) {
    let source = String(text);
    let parseState = "start";
    let stack = [];
    let pos = 0;
    let line = 1;
    let column = 0;
    let token;
    let key;
    let root;
    let lexState;
    let buffer;
    let doubleQuote;
    let sign;
    let c;
    const lexStates = {
      default() {
        switch (c) {
          case "	":
          case "\v":
          case "\f":
          case " ":
          case " ":
          case "\uFEFF":
          case "\n":
          case "\r":
          case "\u2028":
          case "\u2029":
            read();
            return;
          case "/":
            read();
            lexState = "comment";
            return;
          case void 0:
            read();
            return newToken("eof");
        }
        if (isSpaceSeparator(c)) {
          read();
          return;
        }
        return lexStates[parseState]();
      },
      comment() {
        switch (c) {
          case "*":
            read();
            lexState = "multiLineComment";
            return;
          case "/":
            read();
            lexState = "singleLineComment";
            return;
        }
        throw invalidChar(read());
      },
      multiLineComment() {
        switch (c) {
          case "*":
            read();
            lexState = "multiLineCommentAsterisk";
            return;
          case void 0:
            throw invalidChar(read());
        }
        read();
      },
      multiLineCommentAsterisk() {
        switch (c) {
          case "*":
            read();
            return;
          case "/":
            read();
            lexState = "default";
            return;
          case void 0:
            throw invalidChar(read());
        }
        read();
        lexState = "multiLineComment";
      },
      singleLineComment() {
        switch (c) {
          case "\n":
          case "\r":
          case "\u2028":
          case "\u2029":
            read();
            lexState = "default";
            return;
          case void 0:
            read();
            return newToken("eof");
        }
        read();
      },
      value() {
        switch (c) {
          case "{":
          case "[":
            return newToken("punctuator", read());
          case "n":
            read();
            literal("ull");
            return newToken("null", null);
          case "t":
            read();
            literal("rue");
            return newToken("boolean", true);
          case "f":
            read();
            literal("alse");
            return newToken("boolean", false);
          case "-":
          case "+":
            if (read() === "-") {
              sign = -1;
            }
            lexState = "sign";
            return;
          case ".":
            buffer = read();
            lexState = "decimalPointLeading";
            return;
          case "0":
            buffer = read();
            lexState = "zero";
            return;
          case "1":
          case "2":
          case "3":
          case "4":
          case "5":
          case "6":
          case "7":
          case "8":
          case "9":
            buffer = read();
            lexState = "decimalInteger";
            return;
          case "I":
            read();
            literal("nfinity");
            return newToken("numeric", Infinity);
          case "N":
            read();
            literal("aN");
            return newToken("numeric", NaN);
          case '"':
          case "'":
            doubleQuote = read() === '"';
            buffer = "";
            lexState = "string";
            return;
        }
        throw invalidChar(read());
      },
      identifierNameStartEscape() {
        if (c !== "u") {
          throw invalidChar(read());
        }
        read();
        const u = unicodeEscape();
        switch (u) {
          case "$":
          case "_":
            break;
          default:
            if (!isIdStartChar(u)) {
              throw invalidIdentifier();
            }
            break;
        }
        buffer += u;
        lexState = "identifierName";
      },
      identifierName() {
        switch (c) {
          case "$":
          case "_":
          case "‌":
          case "‍":
            buffer += read();
            return;
          case "\\":
            read();
            lexState = "identifierNameEscape";
            return;
        }
        if (isIdContinueChar(c)) {
          buffer += read();
          return;
        }
        return newToken("identifier", buffer);
      },
      identifierNameEscape() {
        if (c !== "u") {
          throw invalidChar(read());
        }
        read();
        const u = unicodeEscape();
        switch (u) {
          case "$":
          case "_":
          case "‌":
          case "‍":
            break;
          default:
            if (!isIdContinueChar(u)) {
              throw invalidIdentifier();
            }
            break;
        }
        buffer += u;
        lexState = "identifierName";
      },
      sign() {
        switch (c) {
          case ".":
            buffer = read();
            lexState = "decimalPointLeading";
            return;
          case "0":
            buffer = read();
            lexState = "zero";
            return;
          case "1":
          case "2":
          case "3":
          case "4":
          case "5":
          case "6":
          case "7":
          case "8":
          case "9":
            buffer = read();
            lexState = "decimalInteger";
            return;
          case "I":
            read();
            literal("nfinity");
            return newToken("numeric", sign * Infinity);
          case "N":
            read();
            literal("aN");
            return newToken("numeric", NaN);
        }
        throw invalidChar(read());
      },
      zero() {
        switch (c) {
          case ".":
            buffer += read();
            lexState = "decimalPoint";
            return;
          case "e":
          case "E":
            buffer += read();
            lexState = "decimalExponent";
            return;
          case "x":
          case "X":
            buffer += read();
            lexState = "hexadecimal";
            return;
          case "n":
            lexState = "bigInt";
            return;
        }
        return newToken("numeric", sign * 0);
      },
      decimalInteger() {
        switch (c) {
          case ".":
            buffer += read();
            lexState = "decimalPoint";
            return;
          case "e":
          case "E":
            buffer += read();
            lexState = "decimalExponent";
            return;
          case "n":
            lexState = "bigInt";
            return;
        }
        if (isDigit(c)) {
          buffer += read();
          return;
        }
        return newNumericToken(sign, buffer);
      },
      decimalPointLeading() {
        if (isDigit(c)) {
          buffer += read();
          lexState = "decimalFraction";
          return;
        }
        throw invalidChar(read());
      },
      decimalPoint() {
        switch (c) {
          case "e":
          case "E":
            buffer += read();
            lexState = "decimalExponent";
            return;
        }
        if (isDigit(c)) {
          buffer += read();
          lexState = "decimalFraction";
          return;
        }
        return newNumericToken(sign, buffer);
      },
      decimalFraction() {
        switch (c) {
          case "e":
          case "E":
            buffer += read();
            lexState = "decimalExponent";
            return;
        }
        if (isDigit(c)) {
          buffer += read();
          return;
        }
        return newNumericToken(sign, buffer);
      },
      decimalExponent() {
        switch (c) {
          case "+":
          case "-":
            buffer += read();
            lexState = "decimalExponentSign";
            return;
        }
        if (isDigit(c)) {
          buffer += read();
          lexState = "decimalExponentInteger";
          return;
        }
        throw invalidChar(read());
      },
      decimalExponentSign() {
        if (isDigit(c)) {
          buffer += read();
          lexState = "decimalExponentInteger";
          return;
        }
        throw invalidChar(read());
      },
      decimalExponentInteger() {
        if (isDigit(c)) {
          buffer += read();
          return;
        }
        return newNumericToken(sign, buffer);
      },
      bigInt() {
        if ((buffer == null ? void 0 : buffer.length) && (isInteger(buffer) || isHex(buffer))) {
          read();
          return newToken("bigint", BigInt(sign) * BigInt(buffer));
        }
        throw invalidChar(read());
      },
      hexadecimal() {
        if (isHexDigit(c)) {
          buffer += read();
          lexState = "hexadecimalInteger";
          return;
        }
        throw invalidChar(read());
      },
      hexadecimalInteger() {
        if (isHexDigit(c)) {
          buffer += read();
          return;
        }
        if (c === "n") {
          lexState = "bigInt";
          return;
        }
        return newNumericToken(sign, buffer);
      },
      string() {
        switch (c) {
          case "\\":
            read();
            buffer += escape();
            return;
          case '"':
            if (doubleQuote) {
              read();
              return newToken("string", buffer);
            }
            buffer += read();
            return;
          case "'":
            if (!doubleQuote) {
              read();
              return newToken("string", buffer);
            }
            buffer += read();
            return;
          case "\n":
          case "\r":
            throw invalidChar(read());
          case "\u2028":
          case "\u2029":
            separatorChar(c);
            break;
          case void 0:
            throw invalidChar(read());
        }
        buffer += read();
      },
      start() {
        switch (c) {
          case "{":
          case "[":
            return newToken("punctuator", read());
          case void 0:
            return newToken("eof");
        }
        lexState = "value";
      },
      beforePropertyName() {
        switch (c) {
          case "$":
          case "_":
            buffer = read();
            lexState = "identifierName";
            return;
          case "\\":
            read();
            lexState = "identifierNameStartEscape";
            return;
          case "}":
            return newToken("punctuator", read());
          case '"':
          case "'":
            doubleQuote = read() === '"';
            lexState = "string";
            return;
        }
        if (isIdStartChar(c)) {
          buffer += read();
          lexState = "identifierName";
          return;
        }
        throw invalidChar(read());
      },
      afterPropertyName() {
        if (c === ":") {
          return newToken("punctuator", read());
        }
        throw invalidChar(read());
      },
      beforePropertyValue() {
        lexState = "value";
      },
      afterPropertyValue() {
        switch (c) {
          case ",":
          case "}":
            return newToken("punctuator", read());
        }
        throw invalidChar(read());
      },
      beforeArrayValue() {
        if (c === "]") {
          return newToken("punctuator", read());
        }
        lexState = "value";
      },
      afterArrayValue() {
        switch (c) {
          case ",":
          case "]":
            return newToken("punctuator", read());
        }
        throw invalidChar(read());
      },
      end() {
        throw invalidChar(read());
      }
    };
    const parseStates = {
      start() {
        if (token.type === "eof") {
          throw invalidEOF();
        }
        push();
      },
      beforePropertyName() {
        switch (token.type) {
          case "identifier":
          case "string":
            key = token.value;
            parseState = "afterPropertyName";
            return;
          case "punctuator":
            pop();
            return;
          case "eof":
            throw invalidEOF();
        }
      },
      afterPropertyName() {
        if (token.type === "eof") {
          throw invalidEOF();
        }
        parseState = "beforePropertyValue";
      },
      beforePropertyValue() {
        if (token.type === "eof") {
          throw invalidEOF();
        }
        push();
      },
      beforeArrayValue() {
        if (token.type === "eof") {
          throw invalidEOF();
        }
        if (token.type === "punctuator" && token.value === "]") {
          pop();
          return;
        }
        push();
      },
      afterPropertyValue() {
        if (token.type === "eof") {
          throw invalidEOF();
        }
        switch (token.value) {
          case ",":
            parseState = "beforePropertyName";
            return;
          case "}":
            pop();
        }
      },
      afterArrayValue() {
        if (token.type === "eof") {
          throw invalidEOF();
        }
        switch (token.value) {
          case ",":
            parseState = "beforeArrayValue";
            return;
          case "]":
            pop();
        }
      },
      end() {
      }
    };
    do {
      token = lex();
      parseStates[parseState]();
    } while (token.type !== "eof");
    if (typeof reviver === "function") {
      return internalize({ "": root }, "", reviver);
    }
    return root;
    function internalize(holder, name, reviver2) {
      const value = holder[name];
      if (value != null && typeof value === "object") {
        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            const key2 = String(i);
            const replacement = internalize(value, key2, reviver2);
            Object.defineProperty(value, key2, {
              value: replacement,
              writable: true,
              enumerable: true,
              configurable: true
            });
          }
        } else {
          for (const key2 in value) {
            const replacement = internalize(value, key2, reviver2);
            if (replacement === void 0) {
              delete value[key2];
            } else {
              Object.defineProperty(value, key2, {
                value: replacement,
                writable: true,
                enumerable: true,
                configurable: true
              });
            }
          }
        }
      }
      return reviver2.call(holder, name, value);
    }
    function lex() {
      lexState = "default";
      buffer = "";
      doubleQuote = false;
      sign = 1;
      for (; ; ) {
        c = peek();
        const token2 = lexStates[lexState]();
        if (token2) {
          return token2;
        }
      }
    }
    function peek() {
      if (source[pos]) {
        return String.fromCodePoint(source.codePointAt(pos));
      }
    }
    function read() {
      const c2 = peek();
      if (c2 === "\n") {
        line++;
        column = 0;
      } else if (c2) {
        column += c2.length;
      } else {
        column++;
      }
      if (c2) {
        pos += c2.length;
      }
      return c2;
    }
    function newToken(type, value) {
      return {
        type,
        value,
        line,
        column
      };
    }
    function newNumericToken(sign2, buffer2) {
      const num = sign2 * Number(buffer2);
      if (options == null ? void 0 : options.withLongNumerals) {
        if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
          try {
            return newToken("bigint", BigInt(sign2) * BigInt(buffer2));
          } catch (ex) {
            console.warn(ex);
          }
        }
      }
      return newToken("numeric", num);
    }
    function literal(s) {
      for (const c2 of s) {
        const p = peek();
        if (p !== c2) {
          throw invalidChar(read());
        }
        read();
      }
    }
    function escape() {
      const c2 = peek();
      switch (c2) {
        case "b":
          read();
          return "\b";
        case "f":
          read();
          return "\f";
        case "n":
          read();
          return "\n";
        case "r":
          read();
          return "\r";
        case "t":
          read();
          return "	";
        case "v":
          read();
          return "\v";
        case "0":
          read();
          if (isDigit(peek())) {
            throw invalidChar(read());
          }
          return "\0";
        case "x":
          read();
          return hexEscape();
        case "u":
          read();
          return unicodeEscape();
        case "\n":
        case "\u2028":
        case "\u2029":
          read();
          return "";
        case "\r":
          read();
          if (peek() === "\n") {
            read();
          }
          return "";
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          throw invalidChar(read());
        case void 0:
          throw invalidChar(read());
      }
      return read();
    }
    function hexEscape() {
      let buffer2 = "";
      let c2 = peek();
      if (!isHexDigit(c2)) {
        throw invalidChar(read());
      }
      buffer2 += read();
      c2 = peek();
      if (!isHexDigit(c2)) {
        throw invalidChar(read());
      }
      buffer2 += read();
      return String.fromCodePoint(parseInt(buffer2, 16));
    }
    function unicodeEscape() {
      let buffer2 = "";
      let count = 4;
      while (count-- > 0) {
        const c2 = peek();
        if (!isHexDigit(c2)) {
          throw invalidChar(read());
        }
        buffer2 += read();
      }
      return String.fromCodePoint(parseInt(buffer2, 16));
    }
    function push() {
      let value;
      switch (token.type) {
        case "punctuator":
          switch (token.value) {
            case "{":
              value = {};
              break;
            case "[":
              value = [];
              break;
          }
          break;
        case "null":
        case "boolean":
        case "numeric":
        case "string":
        case "bigint":
          value = token.value;
          break;
      }
      if (root === void 0) {
        root = value;
      } else {
        const parent = stack[stack.length - 1];
        if (Array.isArray(parent)) {
          parent.push(value);
        } else {
          Object.defineProperty(parent, key, {
            value,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      if (value !== null && typeof value === "object") {
        stack.push(value);
        if (Array.isArray(value)) {
          parseState = "beforeArrayValue";
        } else {
          parseState = "beforePropertyName";
        }
      } else {
        const current = stack[stack.length - 1];
        if (current == null) {
          parseState = "end";
        } else if (Array.isArray(current)) {
          parseState = "afterArrayValue";
        } else {
          parseState = "afterPropertyValue";
        }
      }
    }
    function pop() {
      stack.pop();
      const current = stack[stack.length - 1];
      if (current == null) {
        parseState = "end";
      } else if (Array.isArray(current)) {
        parseState = "afterArrayValue";
      } else {
        parseState = "afterPropertyValue";
      }
    }
    function invalidChar(c2) {
      if (c2 === void 0) {
        return syntaxError(`JSON11: invalid end of input at ${line}:${column}`);
      }
      return syntaxError(`JSON11: invalid character '${formatChar(c2)}' at ${line}:${column}`);
    }
    function invalidEOF() {
      return syntaxError(`JSON11: invalid end of input at ${line}:${column}`);
    }
    function invalidIdentifier() {
      column -= 5;
      return syntaxError(`JSON11: invalid identifier character at ${line}:${column}`);
    }
    function separatorChar(c2) {
      console.warn(`JSON11: '${formatChar(c2)}' in strings is not valid ECMAScript; consider escaping`);
    }
    function formatChar(c2) {
      const replacements = {
        "'": "\\'",
        '"': '\\"',
        "\\": "\\\\",
        "\b": "\\b",
        "\f": "\\f",
        "\n": "\\n",
        "\r": "\\r",
        "	": "\\t",
        "\v": "\\v",
        "\0": "\\0",
        "\u2028": "\\u2028",
        "\u2029": "\\u2029"
      };
      if (replacements[c2]) {
        return replacements[c2];
      }
      if (c2 < " ") {
        const hexString = c2.charCodeAt(0).toString(16);
        return "\\x" + ("00" + hexString).substring(hexString.length);
      }
      return c2;
    }
    function syntaxError(message) {
      const err = new SyntaxError(message);
      Object.defineProperty(err, "lineNumber", {
        value: line,
        writable: true,
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(err, "columnNumber", {
        value: column,
        writable: true,
        enumerable: true,
        configurable: true
      });
      return err;
    }
  }
  function stringify(value, replacerOrAllowListOrOptions, space, options) {
    var _a, _b, _c;
    const stack = [];
    let indent = "";
    let propertyList;
    let replacer;
    let gap = "";
    let quote;
    let withBigInt;
    let nameSerializer = serializeKey;
    let trailingComma = "";
    const quoteWeights = {
      "'": 0.1,
      '"': 0.2
    };
    const quoteReplacements = {
      "'": "\\'",
      '"': '\\"',
      "\\": "\\\\",
      "\b": "\\b",
      "\f": "\\f",
      "\n": "\\n",
      "\r": "\\r",
      "	": "\\t",
      "\v": "\\v",
      "\0": "\\0",
      "\u2028": "\\u2028",
      "\u2029": "\\u2029"
    };
    if (
      // replacerOrAllowListOrOptions is StringifyOptions
      replacerOrAllowListOrOptions != null && typeof replacerOrAllowListOrOptions === "object" && !Array.isArray(replacerOrAllowListOrOptions)
    ) {
      gap = getGap(replacerOrAllowListOrOptions.space);
      if (replacerOrAllowListOrOptions.trailingComma) {
        trailingComma = ",";
      }
      quote = (_b = (_a = replacerOrAllowListOrOptions.quote) == null ? void 0 : _a.trim) == null ? void 0 : _b.call(_a);
      if (replacerOrAllowListOrOptions.quoteNames === true) {
        nameSerializer = quoteString;
      }
      if (typeof replacerOrAllowListOrOptions.replacer === "function") {
        replacer = replacerOrAllowListOrOptions.replacer;
      }
      withBigInt = replacerOrAllowListOrOptions.withBigInt;
    } else {
      if (
        // replacerOrAllowListOrOptions is Replacer
        typeof replacerOrAllowListOrOptions === "function"
      ) {
        replacer = replacerOrAllowListOrOptions;
      } else if (
        // replacerOrAllowListOrOptions is AllowList
        Array.isArray(replacerOrAllowListOrOptions)
      ) {
        propertyList = [];
        const propertySet = /* @__PURE__ */ new Set();
        for (const v of replacerOrAllowListOrOptions) {
          const key = (_c = v == null ? void 0 : v.toString) == null ? void 0 : _c.call(v);
          if (key !== void 0)
            propertySet.add(key);
        }
        propertyList = [...propertySet];
      }
      gap = getGap(space);
      withBigInt = options == null ? void 0 : options.withBigInt;
      if (options == null ? void 0 : options.trailingComma) {
        trailingComma = ",";
      }
    }
    return serializeProperty("", { "": value });
    function getGap(space2) {
      if (typeof space2 === "number" || space2 instanceof Number) {
        const num = Number(space2);
        if (isFinite(num) && num > 0) {
          return " ".repeat(Math.min(10, Math.floor(num)));
        }
      } else if (typeof space2 === "string" || space2 instanceof String) {
        return space2.substring(0, 10);
      }
      return "";
    }
    function serializeProperty(key, holder) {
      let value2 = holder[key];
      if (value2 != null) {
        if (typeof value2.toJSON11 === "function") {
          value2 = value2.toJSON11(key);
        } else if (typeof value2.toJSON5 === "function") {
          value2 = value2.toJSON5(key);
        } else if (typeof value2.toJSON === "function") {
          value2 = value2.toJSON(key);
        }
      }
      if (replacer) {
        value2 = replacer.call(holder, key, value2);
      }
      if (value2 instanceof Number) {
        value2 = Number(value2);
      } else if (value2 instanceof String) {
        value2 = String(value2);
      } else if (value2 instanceof Boolean) {
        value2 = value2.valueOf();
      }
      switch (value2) {
        case null:
          return "null";
        case true:
          return "true";
        case false:
          return "false";
      }
      if (typeof value2 === "string") {
        return quoteString(value2);
      }
      if (typeof value2 === "number") {
        return String(value2);
      }
      if (typeof value2 === "bigint") {
        return value2.toString() + (withBigInt === false ? "" : "n");
      }
      if (typeof value2 === "object") {
        return Array.isArray(value2) ? serializeArray(value2) : serializeObject(value2);
      }
      return void 0;
    }
    function quoteString(value2) {
      let product = "";
      for (let i = 0; i < value2.length; i++) {
        const c = value2[i];
        switch (c) {
          case "'":
          case '"':
            quoteWeights[c]++;
            product += c;
            continue;
          case "\0":
            if (isDigit(value2[i + 1])) {
              product += "\\x00";
              continue;
            }
        }
        if (quoteReplacements[c]) {
          product += quoteReplacements[c];
          continue;
        }
        if (c < " ") {
          let hexString = c.charCodeAt(0).toString(16);
          product += "\\x" + ("00" + hexString).substring(hexString.length);
          continue;
        }
        product += c;
      }
      const quoteChar = quote || Object.keys(quoteWeights).reduce((a, b) => quoteWeights[a] < quoteWeights[b] ? a : b);
      product = product.replace(new RegExp(quoteChar, "g"), quoteReplacements[quoteChar]);
      return quoteChar + product + quoteChar;
    }
    function serializeObject(value2) {
      if (stack.includes(value2)) {
        throw TypeError("Converting circular structure to JSON11");
      }
      stack.push(value2);
      let stepback = indent;
      indent = indent + gap;
      let keys = propertyList || Object.keys(value2);
      let partial = [];
      for (const key of keys) {
        const propertyString = serializeProperty(key, value2);
        if (propertyString !== void 0) {
          let member = nameSerializer(key) + ":";
          if (gap !== "") {
            member += " ";
          }
          member += propertyString;
          partial.push(member);
        }
      }
      let final;
      if (partial.length === 0) {
        final = "{}";
      } else {
        let properties;
        if (gap === "") {
          properties = partial.join(",");
          final = "{" + properties + "}";
        } else {
          properties = partial.join(",\n" + indent);
          final = "{\n" + indent + properties + trailingComma + "\n" + stepback + "}";
        }
      }
      stack.pop();
      indent = stepback;
      return final;
    }
    function serializeKey(key) {
      if (key.length === 0) {
        return quoteString(key);
      }
      const firstChar = String.fromCodePoint(key.codePointAt(0));
      if (!isIdStartChar(firstChar)) {
        return quoteString(key);
      }
      for (let i = firstChar.length; i < key.length; i++) {
        if (!isIdContinueChar(String.fromCodePoint(key.codePointAt(i)))) {
          return quoteString(key);
        }
      }
      return key;
    }
    function serializeArray(value2) {
      if (stack.includes(value2)) {
        throw TypeError("Converting circular structure to JSON11");
      }
      stack.push(value2);
      let stepback = indent;
      indent = indent + gap;
      let partial = [];
      for (let i = 0; i < value2.length; i++) {
        const propertyString = serializeProperty(String(i), value2);
        partial.push(propertyString !== void 0 ? propertyString : "null");
      }
      let final;
      if (partial.length === 0) {
        final = "[]";
      } else {
        if (gap === "") {
          let properties = partial.join(",");
          final = "[" + properties + "]";
        } else {
          let properties = partial.join(",\n" + indent);
          final = "[\n" + indent + properties + trailingComma + "\n" + stepback + "]";
        }
      }
      stack.pop();
      indent = stepback;
      return final;
    }
  }
  exports2.parse = parse;
  exports2.stringify = stringify;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});


/***/ }),

/***/ "../../node_modules/node-libs-browser/node_modules/punycode/punycode.js":
/*!*******************************************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/node-libs-browser/node_modules/punycode/punycode.js ***!
  \*******************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module, global) {var __WEBPACK_AMD_DEFINE_RESULT__;/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports =  true && exports &&
		!exports.nodeType && exports;
	var freeModule =  true && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		true
	) {
		!(__WEBPACK_AMD_DEFINE_RESULT__ = (function() {
			return punycode;
		}).call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	} else {}

}(this));

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../webpack/buildin/module.js */ "../../node_modules/webpack/buildin/module.js")(module), __webpack_require__(/*! ./../../../webpack/buildin/global.js */ "../../node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "../../node_modules/node-libs-browser/node_modules/url/url.js":
/*!*********************************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/node-libs-browser/node_modules/url/url.js ***!
  \*********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var punycode = __webpack_require__(/*! punycode */ "../../node_modules/node-libs-browser/node_modules/punycode/punycode.js");
var util = __webpack_require__(/*! ./util */ "../../node_modules/node-libs-browser/node_modules/url/util.js");

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = __webpack_require__(/*! querystring */ "../../node_modules/querystring-es3/index.js");

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};


/***/ }),

/***/ "../../node_modules/node-libs-browser/node_modules/url/util.js":
/*!**********************************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/node-libs-browser/node_modules/url/util.js ***!
  \**********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};


/***/ }),

/***/ "../../node_modules/querystring-es3/decode.js":
/*!*****************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/querystring-es3/decode.js ***!
  \*****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};


/***/ }),

/***/ "../../node_modules/querystring-es3/encode.js":
/*!*****************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/querystring-es3/encode.js ***!
  \*****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};


/***/ }),

/***/ "../../node_modules/querystring-es3/index.js":
/*!****************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/querystring-es3/index.js ***!
  \****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.decode = exports.parse = __webpack_require__(/*! ./decode */ "../../node_modules/querystring-es3/decode.js");
exports.encode = exports.stringify = __webpack_require__(/*! ./encode */ "../../node_modules/querystring-es3/encode.js");


/***/ }),

/***/ "../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js":
/*!*********************************************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js ***!
  \*********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var isOldIE = function isOldIE() {
  var memo;
  return function memorize() {
    if (typeof memo === 'undefined') {
      // Test for IE <= 9 as proposed by Browserhacks
      // @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
      // Tests for existence of standard globals is to allow style-loader
      // to operate correctly into non-standard environments
      // @see https://github.com/webpack-contrib/style-loader/issues/177
      memo = Boolean(window && document && document.all && !window.atob);
    }

    return memo;
  };
}();

var getTarget = function getTarget() {
  var memo = {};
  return function memorize(target) {
    if (typeof memo[target] === 'undefined') {
      var styleTarget = document.querySelector(target); // Special case to return head of iframe instead of iframe itself

      if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
        try {
          // This will throw an exception if access to iframe is blocked
          // due to cross-origin restrictions
          styleTarget = styleTarget.contentDocument.head;
        } catch (e) {
          // istanbul ignore next
          styleTarget = null;
        }
      }

      memo[target] = styleTarget;
    }

    return memo[target];
  };
}();

var stylesInDom = [];

function getIndexByIdentifier(identifier) {
  var result = -1;

  for (var i = 0; i < stylesInDom.length; i++) {
    if (stylesInDom[i].identifier === identifier) {
      result = i;
      break;
    }
  }

  return result;
}

function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];

  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var index = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3]
    };

    if (index !== -1) {
      stylesInDom[index].references++;
      stylesInDom[index].updater(obj);
    } else {
      stylesInDom.push({
        identifier: identifier,
        updater: addStyle(obj, options),
        references: 1
      });
    }

    identifiers.push(identifier);
  }

  return identifiers;
}

function insertStyleElement(options) {
  var style = document.createElement('style');
  var attributes = options.attributes || {};

  if (typeof attributes.nonce === 'undefined') {
    var nonce =  true ? __webpack_require__.nc : undefined;

    if (nonce) {
      attributes.nonce = nonce;
    }
  }

  Object.keys(attributes).forEach(function (key) {
    style.setAttribute(key, attributes[key]);
  });

  if (typeof options.insert === 'function') {
    options.insert(style);
  } else {
    var target = getTarget(options.insert || 'head');

    if (!target) {
      throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
    }

    target.appendChild(style);
  }

  return style;
}

function removeStyleElement(style) {
  // istanbul ignore if
  if (style.parentNode === null) {
    return false;
  }

  style.parentNode.removeChild(style);
}
/* istanbul ignore next  */


var replaceText = function replaceText() {
  var textStore = [];
  return function replace(index, replacement) {
    textStore[index] = replacement;
    return textStore.filter(Boolean).join('\n');
  };
}();

function applyToSingletonTag(style, index, remove, obj) {
  var css = remove ? '' : obj.media ? "@media ".concat(obj.media, " {").concat(obj.css, "}") : obj.css; // For old IE

  /* istanbul ignore if  */

  if (style.styleSheet) {
    style.styleSheet.cssText = replaceText(index, css);
  } else {
    var cssNode = document.createTextNode(css);
    var childNodes = style.childNodes;

    if (childNodes[index]) {
      style.removeChild(childNodes[index]);
    }

    if (childNodes.length) {
      style.insertBefore(cssNode, childNodes[index]);
    } else {
      style.appendChild(cssNode);
    }
  }
}

function applyToTag(style, options, obj) {
  var css = obj.css;
  var media = obj.media;
  var sourceMap = obj.sourceMap;

  if (media) {
    style.setAttribute('media', media);
  } else {
    style.removeAttribute('media');
  }

  if (sourceMap && typeof btoa !== 'undefined') {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  } // For old IE

  /* istanbul ignore if  */


  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    while (style.firstChild) {
      style.removeChild(style.firstChild);
    }

    style.appendChild(document.createTextNode(css));
  }
}

var singleton = null;
var singletonCounter = 0;

function addStyle(obj, options) {
  var style;
  var update;
  var remove;

  if (options.singleton) {
    var styleIndex = singletonCounter++;
    style = singleton || (singleton = insertStyleElement(options));
    update = applyToSingletonTag.bind(null, style, styleIndex, false);
    remove = applyToSingletonTag.bind(null, style, styleIndex, true);
  } else {
    style = insertStyleElement(options);
    update = applyToTag.bind(null, style, options);

    remove = function remove() {
      removeStyleElement(style);
    };
  }

  update(obj);
  return function updateStyle(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap) {
        return;
      }

      update(obj = newObj);
    } else {
      remove();
    }
  };
}

module.exports = function (list, options) {
  options = options || {}; // Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
  // tags it will allow on a page

  if (!options.singleton && typeof options.singleton !== 'boolean') {
    options.singleton = isOldIE();
  }

  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];

    if (Object.prototype.toString.call(newList) !== '[object Array]') {
      return;
    }

    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDom[index].references--;
    }

    var newLastIdentifiers = modulesToDom(newList, options);

    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];

      var _index = getIndexByIdentifier(_identifier);

      if (stylesInDom[_index].references === 0) {
        stylesInDom[_index].updater();

        stylesInDom.splice(_index, 1);
      }
    }

    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ }),

/***/ "../../node_modules/val-loader/dist/cjs.js?key=queryEnhancements!../../packages/osd-ui-shared-deps/public_path_module_creator.js":
/*!*****************************************************************************************************************************************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/node_modules/val-loader/dist/cjs.js?key=queryEnhancements!/home/ubuntu/repos/OpenSearch-Dashboards-1/packages/osd-ui-shared-deps/public_path_module_creator.js ***!
  \*****************************************************************************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__.p = window.__osdPublicPath__['queryEnhancements']

/***/ }),

/***/ "../../node_modules/webpack/buildin/global.js":
/*!***********************************!*\
  !*** (webpack)/buildin/global.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),

/***/ "../../node_modules/webpack/buildin/module.js":
/*!***********************************!*\
  !*** (webpack)/buildin/module.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function(module) {
	if (!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if (!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),

/***/ "../../packages/osd-optimizer/target/worker/entry_point_creator.js":
/*!**************************************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/packages/osd-optimizer/target/worker/entry_point_creator.js ***!
  \**************************************************************************************************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _node_modules_val_loader_dist_cjs_js_key_queryEnhancements_osd_ui_shared_deps_public_path_module_creator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../../node_modules/val-loader/dist/cjs.js?key=queryEnhancements!../../../osd-ui-shared-deps/public_path_module_creator.js */ "../../node_modules/val-loader/dist/cjs.js?key=queryEnhancements!../../packages/osd-ui-shared-deps/public_path_module_creator.js");
/* harmony import */ var _node_modules_val_loader_dist_cjs_js_key_queryEnhancements_osd_ui_shared_deps_public_path_module_creator_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_val_loader_dist_cjs_js_key_queryEnhancements_osd_ui_shared_deps_public_path_module_creator_js__WEBPACK_IMPORTED_MODULE_0__);
__osdBundles__.define('plugin/queryEnhancements/public', __webpack_require__, /*require.resolve*/(/*! ../../../../plugins/query_enhancements/public */ "./public/index.ts"))

/***/ }),

/***/ "../../packages/osd-std/target/web/assert_never.js":
/*!**********************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/packages/osd-std/target/web/assert_never.js ***!
  \**********************************************************************************************/
/*! exports provided: assertNever */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "assertNever", function() { return assertNever; });
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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Can be used in switch statements to ensure we perform exhaustive checks, see
 * https://www.typescriptlang.org/docs/handbook/advanced-types.html#exhaustiveness-checking
 *
 * @public
 */
function assertNever(x) {
  throw new Error("Unexpected object: ".concat(x));
}

/***/ }),

/***/ "../../packages/osd-std/target/web/clean.js":
/*!***************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/packages/osd-std/target/web/clean.js ***!
  \***************************************************************************************/
/*! exports provided: cleanControlSequences */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "cleanControlSequences", function() { return cleanControlSequences; });
/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* Replaces a bunch of characters that should not be printed:
 *    0x03  ETX: End of Text
 *    0x04  EOT: End of Transmission
 *    0x05  ENQ: Enquiry
 *    0x07  BEL: Bell
 *    0x08  BS:  Backspace
 *    0x0B  VT:  Vertical Tabulation
 *    0x0C  FF:  Form Feed
 *    0x0D  CR:  Carriage Return
 *    0x0E  SO:  Shift Out
 *    0x0F  SI:  Shift In
 *    0x10  DLE: Data Link Escape
 *    0x11  DC1: Device Control One
 *    0x12  DC2: Device Control Two
 *    0x13  DC3: Device Control Three
 *    0x14  DC4: Device Control Four
 *    0x15  NAK: Negative Acknowledge
 *    0x16  SYN: Synchronous Idle
 *    0x17  ETB: End of Transmission Block
 *    0x18  CAN: Cancel
 *    0x19  EM:  End of Medium
 *    0x1A  SUB: EoF on Windows
 *    0x1B  ESC: Starts all the escape sequences
 *    0x1C  FS:  File Separator
 *    0x1D  GS:  Group Separator
 *    0x1E  RS:  Record Separator
 *    0x1F  US:  Unit Separator
 *    0x7F  Del
 *    0x90  DCS: Device Control String
 *    0x9B  CSI: Control Sequence Introducer
 *    0x9C  OSC: Operating System Command
 *
 * Ref: https://en.wikipedia.org/wiki/Control_character
 */
const cleanControlSequences = text => {
  return text.replace(/[\x03-\x05\x07\x08\x0B-\x1F\x7F\x90\x9B\x9C]/g, char => "(U+".concat(char.charCodeAt(0).toString(16).padStart(4, '0'), ")"));
};

/***/ }),

/***/ "../../packages/osd-std/target/web/deep_freeze.js":
/*!*********************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/packages/osd-std/target/web/deep_freeze.js ***!
  \*********************************************************************************************/
/*! exports provided: deepFreeze */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "deepFreeze", function() { return deepFreeze; });
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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/** @public */

/**
 * Apply Object.freeze to a value recursively and convert the return type to
 * Readonly variant recursively
 *
 * @public
 */
function deepFreeze(object) {
  // for any properties that reference an object, makes sure that object is
  // recursively frozen as well
  for (const value of Object.values(object)) {
    if (value !== null && typeof value === 'object') {
      deepFreeze(value);
    }
  }
  return Object.freeze(object);
}

/***/ }),

/***/ "../../packages/osd-std/target/web/get.js":
/*!*************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/packages/osd-std/target/web/get.js ***!
  \*************************************************************************************/
/*! exports provided: get */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "get", function() { return get; });
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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Retrieve the value for the specified path
 *
 * Note that dot is _not_ allowed to specify a deeper key, it will assume that
 * the dot is part of the key itself.
 */

function get(obj, path) {
  if (typeof path === 'string') {
    if (path.includes('.')) {
      throw new Error('Using dots in `get` with a string is not allowed, use array instead');
    }
    return obj[path];
  }
  for (const key of path) {
    obj = obj[key];
  }
  return obj;
}

/***/ }),

/***/ "../../packages/osd-std/target/web/get_flattened_object.js":
/*!******************************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/packages/osd-std/target/web/get_flattened_object.js ***!
  \******************************************************************************************************/
/*! exports provided: getFlattenedObject */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getFlattenedObject", function() { return getFlattenedObject; });
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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

function shouldReadKeys(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 *  Flattens a deeply nested object to a map of dot-separated
 *  paths pointing to all primitive values **and arrays**
 *  from `rootValue`.
 *
 *  example:
 *    getFlattenedObject({ a: { b: 1, c: [2,3] } })
 *    // => { 'a.b': 1, 'a.c': [2,3] }
 *
 *  @public
 */
function getFlattenedObject(rootValue) {
  if (!shouldReadKeys(rootValue)) {
    throw new TypeError("Root value is not flatten-able, received ".concat(rootValue));
  }
  const result = {};
  (function flatten(prefix, object) {
    for (const [key, value] of Object.entries(object)) {
      const path = prefix ? "".concat(prefix, ".").concat(key) : key;
      if (shouldReadKeys(value)) {
        flatten(path, value);
      } else {
        result[path] = value;
      }
    }
  })('', rootValue);
  return result;
}

/***/ }),

/***/ "../../packages/osd-std/target/web/index.js":
/*!***************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/packages/osd-std/target/web/index.js ***!
  \***************************************************************************************/
/*! exports provided: assertNever, deepFreeze, get, mapToObject, merge, pick, withTimeout, isRelativeUrl, modifyUrl, getUrlOrigin, unset, getFlattenedObject, validateObject, firstValueFrom, lastValueFrom, parse, stringify, cleanControlSequences */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _assert_never__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./assert_never */ "../../packages/osd-std/target/web/assert_never.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "assertNever", function() { return _assert_never__WEBPACK_IMPORTED_MODULE_0__["assertNever"]; });

/* harmony import */ var _deep_freeze__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./deep_freeze */ "../../packages/osd-std/target/web/deep_freeze.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "deepFreeze", function() { return _deep_freeze__WEBPACK_IMPORTED_MODULE_1__["deepFreeze"]; });

/* harmony import */ var _get__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./get */ "../../packages/osd-std/target/web/get.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "get", function() { return _get__WEBPACK_IMPORTED_MODULE_2__["get"]; });

/* harmony import */ var _map_to_object__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./map_to_object */ "../../packages/osd-std/target/web/map_to_object.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "mapToObject", function() { return _map_to_object__WEBPACK_IMPORTED_MODULE_3__["mapToObject"]; });

/* harmony import */ var _merge__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./merge */ "../../packages/osd-std/target/web/merge.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "merge", function() { return _merge__WEBPACK_IMPORTED_MODULE_4__["merge"]; });

/* harmony import */ var _pick__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./pick */ "../../packages/osd-std/target/web/pick.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "pick", function() { return _pick__WEBPACK_IMPORTED_MODULE_5__["pick"]; });

/* harmony import */ var _promise__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./promise */ "../../packages/osd-std/target/web/promise.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "withTimeout", function() { return _promise__WEBPACK_IMPORTED_MODULE_6__["withTimeout"]; });

/* harmony import */ var _url__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./url */ "../../packages/osd-std/target/web/url.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "isRelativeUrl", function() { return _url__WEBPACK_IMPORTED_MODULE_7__["isRelativeUrl"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "modifyUrl", function() { return _url__WEBPACK_IMPORTED_MODULE_7__["modifyUrl"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "getUrlOrigin", function() { return _url__WEBPACK_IMPORTED_MODULE_7__["getUrlOrigin"]; });

/* harmony import */ var _unset__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./unset */ "../../packages/osd-std/target/web/unset.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "unset", function() { return _unset__WEBPACK_IMPORTED_MODULE_8__["unset"]; });

/* harmony import */ var _get_flattened_object__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./get_flattened_object */ "../../packages/osd-std/target/web/get_flattened_object.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "getFlattenedObject", function() { return _get_flattened_object__WEBPACK_IMPORTED_MODULE_9__["getFlattenedObject"]; });

/* harmony import */ var _validate_object__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./validate_object */ "../../packages/osd-std/target/web/validate_object.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "validateObject", function() { return _validate_object__WEBPACK_IMPORTED_MODULE_10__["validateObject"]; });

/* harmony import */ var _rxjs_7__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./rxjs_7 */ "../../packages/osd-std/target/web/rxjs_7.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "firstValueFrom", function() { return _rxjs_7__WEBPACK_IMPORTED_MODULE_11__["firstValueFrom"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "lastValueFrom", function() { return _rxjs_7__WEBPACK_IMPORTED_MODULE_11__["lastValueFrom"]; });

/* harmony import */ var _json__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./json */ "../../packages/osd-std/target/web/json.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "parse", function() { return _json__WEBPACK_IMPORTED_MODULE_12__["parse"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "stringify", function() { return _json__WEBPACK_IMPORTED_MODULE_12__["stringify"]; });

/* harmony import */ var _clean__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./clean */ "../../packages/osd-std/target/web/clean.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "cleanControlSequences", function() { return _clean__WEBPACK_IMPORTED_MODULE_13__["cleanControlSequences"]; });

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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
















/***/ }),

/***/ "../../packages/osd-std/target/web/json.js":
/*!**************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/packages/osd-std/target/web/json.js ***!
  \**************************************************************************************/
/*! exports provided: stringify, parse */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "stringify", function() { return stringify; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "parse", function() { return parse; });
/* harmony import */ var json11__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! json11 */ "../../node_modules/json11/dist/umd/index.js");
/* harmony import */ var json11__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(json11__WEBPACK_IMPORTED_MODULE_0__);
/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */


const stringify = (obj, replacer, space) => {
  let text;
  let numeralsAreNumbers = true;
  /* For better performance, instead of testing for existence of `replacer` on each value, two almost
   * identical functions are used.
   *
   * Note: Converting BigInt values to numbers, `Number()` is much faster that `parseInt()`. Since we
   * check the `type`, it is safe to just use `Number()`.
   */
  const checkForBigInts = replacer ? function (key, val) {
    if (typeof val === 'bigint') {
      numeralsAreNumbers = false;
      return replacer.call(this, key, Number(val));
    }
    return replacer.call(this, key, val);
  } : (key, val) => {
    if (typeof val === 'bigint') {
      numeralsAreNumbers = false;
      return Number(val);
    }
    return val;
  };

  /* While this is a check for possibly having BigInt values, if none were found, the results is
   * sufficient to fulfill the purpose of the function. However, if BigInt values were found, we will
   * use `stringifyObjectWithBigInts` to do this again.
   *
   * The goal was not to punish every object that doesn't have a BigInt with the more expensive
   * `stringifyObjectWithBigInts`. Those with BigInt values are also not unduly burdened because we
   * still need it in its string form to find a suitable marker.
   */
  text = JSON.stringify(obj, checkForBigInts, space);
  if (!numeralsAreNumbers) {
    const temp = json11__WEBPACK_IMPORTED_MODULE_0___default.a.stringify(obj, {
      replacer,
      space,
      withBigInt: false,
      quote: '"',
      quoteNames: true
    });
    if (temp) text = temp;
  }
  return text;
};
const parse = (text, reviver) => {
  let obj;
  let numeralsAreNumbers = true;
  const inspectValueForLargeNumerals = val => {
    if (numeralsAreNumbers && typeof val === 'number' && isFinite(val) && (val < Number.MAX_SAFE_INTEGER || val > Number.MAX_SAFE_INTEGER)) {
      numeralsAreNumbers = false;
    }

    // This function didn't have to have a return value but having it makes the rest cleaner
    return val;
  };

  /* For better performance, instead of testing for existence of `reviver` on each value, two almost
   * identical functions are used.
   */
  const checkForLargeNumerals = reviver ? function (key, val) {
    return inspectValueForLargeNumerals(reviver.call(this, key, val));
  } : (key, val) => inspectValueForLargeNumerals(val);

  /* While this is a check for possibly having BigInt values, if none were found, the results is
   * sufficient to fulfill the purpose of the function. However, if BigInt values were found, we will
   * use `stringifyObjectWithBigInts` to do this again.
   *
   * The goal was not to punish every object that doesn't have a BigInt with the more expensive
   * `stringifyObjectWithBigInts`. Those with BigInt values are also not unduly burdened because we
   * still need it in its string form to find a suitable marker.
   */
  obj = JSON.parse(text, checkForLargeNumerals);
  if (!numeralsAreNumbers) {
    const temp = json11__WEBPACK_IMPORTED_MODULE_0___default.a.parse(text, reviver, {
      withLongNumerals: true
    });
    if (temp) obj = temp;
  }
  return obj;
};

/***/ }),

/***/ "../../packages/osd-std/target/web/map_to_object.js":
/*!***********************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/packages/osd-std/target/web/map_to_object.js ***!
  \***********************************************************************************************/
/*! exports provided: mapToObject */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "mapToObject", function() { return mapToObject; });
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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

function mapToObject(map) {
  const result = Object.create(null);
  for (const [key, value] of map) {
    result[key] = value;
  }
  return result;
}

/***/ }),

/***/ "../../packages/osd-std/target/web/merge.js":
/*!***************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/packages/osd-std/target/web/merge.js ***!
  \***************************************************************************************/
/*! exports provided: merge */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "merge", function() { return merge; });
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash */ "lodash");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_0__);
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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */


/**
 * Deeply merges two objects, omitting undefined values, and not deeply merging Arrays.
 *
 * @remarks
 * Should behave identically to lodash.merge, however it will not merge Array values like lodash does.
 * Any properties with `undefined` values on both objects will be ommitted from the returned object.
 */

function merge(baseObj) {
  for (var _len = arguments.length, sources = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    sources[_key - 1] = arguments[_key];
  }
  const firstSource = sources[0];
  if (firstSource === undefined) {
    return baseObj;
  }
  return sources.slice(1).reduce((merged, nextSource) => mergeObjects(merged, nextSource), mergeObjects(baseObj, firstSource));
}
const isMergable = obj => Object(lodash__WEBPACK_IMPORTED_MODULE_0__["isPlainObject"])(obj);
const mergeObjects = (baseObj, overrideObj) => [...new Set([...Object.keys(baseObj), ...Object.keys(overrideObj)])].reduce((merged, key) => {
  const baseVal = baseObj[key];
  const overrideVal = overrideObj[key];
  if (isMergable(baseVal) && isMergable(overrideVal)) {
    merged[key] = mergeObjects(baseVal, overrideVal);
  } else if (overrideVal !== undefined) {
    merged[key] = overrideVal;
  } else if (baseVal !== undefined) {
    merged[key] = baseVal;
  }
  return merged;
}, {});

/***/ }),

/***/ "../../packages/osd-std/target/web/pick.js":
/*!**************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/packages/osd-std/target/web/pick.js ***!
  \**************************************************************************************/
/*! exports provided: pick */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "pick", function() { return pick; });
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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

function pick(obj, keys) {
  return keys.reduce((acc, key) => {
    if (obj.hasOwnProperty(key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
}

/***/ }),

/***/ "../../packages/osd-std/target/web/promise.js":
/*!*****************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/packages/osd-std/target/web/promise.js ***!
  \*****************************************************************************************/
/*! exports provided: withTimeout */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "withTimeout", function() { return withTimeout; });
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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

function withTimeout(_ref) {
  let {
    promise,
    timeout,
    errorMessage
  } = _ref;
  return Promise.race([promise, new Promise((resolve, reject) => setTimeout(() => reject(new Error(errorMessage)), timeout))]);
}

/***/ }),

/***/ "../../packages/osd-std/target/web/rxjs_7.js":
/*!****************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/packages/osd-std/target/web/rxjs_7.js ***!
  \****************************************************************************************/
/*! exports provided: firstValueFrom, lastValueFrom */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "firstValueFrom", function() { return firstValueFrom; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "lastValueFrom", function() { return lastValueFrom; });
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! rxjs/operators */ "rxjs/operators");
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(rxjs_operators__WEBPACK_IMPORTED_MODULE_0__);
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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */


function firstValueFrom(source) {
  // we can't use SafeSubscriber the same way that RxJS 7 does, so instead we
  return source.pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_0__["first"])()).toPromise();
}
function lastValueFrom(source) {
  return source.pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_0__["last"])()).toPromise();
}

/***/ }),

/***/ "../../packages/osd-std/target/web/unset.js":
/*!***************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/packages/osd-std/target/web/unset.js ***!
  \***************************************************************************************/
/*! exports provided: unset */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "unset", function() { return unset; });
/* harmony import */ var _get__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./get */ "../../packages/osd-std/target/web/get.js");
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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */



/**
 * Unset a (potentially nested) key from given object.
 * This mutates the original object.
 *
 * @example
 * ```
 * unset(myObj, 'someRootProperty');
 * unset(myObj, 'some.nested.path');
 * ```
 */
function unset(obj, atPath) {
  const paths = atPath.split('.').map(s => s.trim()).filter(v => v !== '');
  if (paths.length === 0) {
    return;
  }
  if (paths.length === 1) {
    delete obj[paths[0]];
    return;
  }
  const property = paths.pop();
  const parent = Object(_get__WEBPACK_IMPORTED_MODULE_0__["get"])(obj, paths);
  if (parent !== undefined) {
    delete parent[property];
  }
}

/***/ }),

/***/ "../../packages/osd-std/target/web/url.js":
/*!*************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/packages/osd-std/target/web/url.js ***!
  \*************************************************************************************/
/*! exports provided: modifyUrl, isRelativeUrl, getUrlOrigin */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "modifyUrl", function() { return modifyUrl; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isRelativeUrl", function() { return isRelativeUrl; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getUrlOrigin", function() { return getUrlOrigin; });
/* harmony import */ var url__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! url */ "../../node_modules/node-libs-browser/node_modules/url/url.js");
/* harmony import */ var url__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(url__WEBPACK_IMPORTED_MODULE_0__);
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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */



/**
 * We define our own typings because the current version of @types/node
 * declares properties to be optional "hostname?: string".
 * Although, parse call returns "hostname: null | string".
 *
 * @public
 */

/**
 *  Takes a URL and a function that takes the meaningful parts
 *  of the URL as a key-value object, modifies some or all of
 *  the parts, and returns the modified parts formatted again
 *  as a url.
 *
 *  Url Parts sent:
 *    - protocol
 *    - slashes (does the url have the //)
 *    - auth
 *    - hostname (just the name of the host, no port or auth information)
 *    - port
 *    - pathname (the path after the hostname, no query or hash, starts
 *        with a slash if there was a path)
 *    - query (always an object, even when no query on original url)
 *    - hash
 *
 *  Why?
 *    - The default url library in node produces several conflicting
 *      properties on the "parsed" output. Modifying any of these might
 *      lead to the modifications being ignored (depending on which
 *      property was modified)
 *    - It's not always clear whether to use path/pathname, host/hostname,
 *      so this tries to add helpful constraints
 *
 *  @param url The string url to parse.
 *  @param urlModifier A function that will modify the parsed url, or return a new one.
 *  @returns The modified and reformatted url
 *  @public
 */
function modifyUrl(url, urlModifier) {
  const parsed = Object(url__WEBPACK_IMPORTED_MODULE_0__["parse"])(url, true);

  // Copy over the most specific version of each property. By default, the parsed url includes several
  // conflicting properties (like path and pathname + search, or search and query) and keeping track
  // of which property is actually used when they are formatted is harder than necessary.
  const meaningfulParts = {
    auth: parsed.auth,
    hash: parsed.hash,
    hostname: parsed.hostname,
    pathname: parsed.pathname,
    port: parsed.port,
    protocol: parsed.protocol,
    query: parsed.query || {},
    slashes: parsed.slashes
  };

  // The urlModifier modifies the meaningfulParts object, or returns a new one.
  const modifiedParts = urlModifier(meaningfulParts) || meaningfulParts;

  // Format the modified/replaced meaningfulParts back into a url.
  return Object(url__WEBPACK_IMPORTED_MODULE_0__["format"])({
    auth: modifiedParts.auth,
    hash: modifiedParts.hash,
    hostname: modifiedParts.hostname,
    pathname: modifiedParts.pathname,
    port: modifiedParts.port,
    protocol: modifiedParts.protocol,
    query: modifiedParts.query,
    slashes: modifiedParts.slashes
  });
}

/**
 * Determine if a url is relative. Any url including a protocol, hostname, or
 * port is not considered relative. This means that absolute *paths* are considered
 * to be relative *urls*
 * @public
 */
function isRelativeUrl(candidatePath) {
  // validate that `candidatePath` is not attempting a redirect to somewhere
  // outside of this OpenSearch Dashboards install
  const all = Object(url__WEBPACK_IMPORTED_MODULE_0__["parse"])(candidatePath, false /* parseQueryString */, true /* slashesDenoteHost */);
  const {
    protocol,
    hostname,
    port
  } = all;
  // We should explicitly compare `protocol`, `port` and `hostname` to null to make sure these are not
  // detected in the URL at all. For example `hostname` can be empty string for Node URL parser, but
  // browser (because of various bwc reasons) processes URL differently (e.g. `///abc.com` - for browser
  // hostname is `abc.com`, but for Node hostname is an empty string i.e. everything between schema (`//`)
  // and the first slash that belongs to path.
  if (protocol !== null || hostname !== null || port !== null) {
    return false;
  }
  return true;
}

/**
 * Returns the origin (protocol + host + port) from given `url` if `url` is a valid absolute url, or null otherwise
 */
function getUrlOrigin(url) {
  const obj = Object(url__WEBPACK_IMPORTED_MODULE_0__["parse"])(url);
  if (!obj.protocol && !obj.hostname) {
    return null;
  }
  return "".concat(obj.protocol, "//").concat(obj.hostname).concat(obj.port ? ":".concat(obj.port) : '');
}

/***/ }),

/***/ "../../packages/osd-std/target/web/validate_object.js":
/*!*************************************************************************************************!*\
  !*** /home/ubuntu/repos/OpenSearch-Dashboards-1/packages/osd-std/target/web/validate_object.js ***!
  \*************************************************************************************************/
/*! exports provided: validateObject */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "validateObject", function() { return validateObject; });
/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// we have to do Object.prototype.hasOwnProperty because when you create an object using
// Object.create(null), and I assume other methods, you get an object without a prototype,
// so you can't use current.hasOwnProperty
const hasOwnProperty = (obj, property) => Object.prototype.hasOwnProperty.call(obj, property);
const isObject = obj => typeof obj === 'object' && obj !== null;

// we're using a stack instead of recursion so we aren't limited by the call stack
function validateObject(obj) {
  if (!isObject(obj)) {
    return;
  }
  const stack = [{
    value: obj,
    previousKey: null
  }];
  const seen = new WeakSet([obj]);
  while (stack.length > 0) {
    const {
      value,
      previousKey
    } = stack.pop();
    if (!isObject(value)) {
      continue;
    }
    if (hasOwnProperty(value, '__proto__')) {
      throw new Error("'__proto__' is an invalid key");
    }
    if (hasOwnProperty(value, 'prototype') && previousKey === 'constructor') {
      throw new Error("'constructor.prototype' is an invalid key");
    }

    // iterating backwards through an array is reportedly more performant
    const entries = Object.entries(value);
    for (let i = entries.length - 1; i >= 0; --i) {
      const [key, childValue] = entries[i];
      if (isObject(childValue)) {
        if (seen.has(childValue)) {
          throw new Error('circular reference detected');
        }
        seen.add(childValue);
      }
      stack.push({
        value: childValue,
        previousKey: key
      });
    }
  }
}

/***/ }),

/***/ "./common/index.ts":
/*!*************************!*\
  !*** ./common/index.ts ***!
  \*************************/
/*! exports provided: PLUGIN_ID, PLUGIN_NAME, PPL_SEARCH_STRATEGY, SQL_SEARCH_STRATEGY, SQL_ASYNC_SEARCH_STRATEGY, PPL_ENDPOINT, SQL_ENDPOINT, OPENSEARCH_PANELS_API, OPENSEARCH_DATACONNECTIONS_API, JOBS_ENDPOINT_BASE, BASE_ML_COMMONS_URI, QUERY_ENABLE_ENHANCEMENTS_SETTING, formatDate, getFields, removeKeyword */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PLUGIN_ID", function() { return PLUGIN_ID; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PLUGIN_NAME", function() { return PLUGIN_NAME; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PPL_SEARCH_STRATEGY", function() { return PPL_SEARCH_STRATEGY; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SQL_SEARCH_STRATEGY", function() { return SQL_SEARCH_STRATEGY; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SQL_ASYNC_SEARCH_STRATEGY", function() { return SQL_ASYNC_SEARCH_STRATEGY; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PPL_ENDPOINT", function() { return PPL_ENDPOINT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SQL_ENDPOINT", function() { return SQL_ENDPOINT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OPENSEARCH_PANELS_API", function() { return OPENSEARCH_PANELS_API; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OPENSEARCH_DATACONNECTIONS_API", function() { return OPENSEARCH_DATACONNECTIONS_API; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "JOBS_ENDPOINT_BASE", function() { return JOBS_ENDPOINT_BASE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BASE_ML_COMMONS_URI", function() { return BASE_ML_COMMONS_URI; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "QUERY_ENABLE_ENHANCEMENTS_SETTING", function() { return QUERY_ENABLE_ENHANCEMENTS_SETTING; });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./common/utils.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "formatDate", function() { return _utils__WEBPACK_IMPORTED_MODULE_0__["formatDate"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "getFields", function() { return _utils__WEBPACK_IMPORTED_MODULE_0__["getFields"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "removeKeyword", function() { return _utils__WEBPACK_IMPORTED_MODULE_0__["removeKeyword"]; });

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const PLUGIN_ID = 'queryEnhancements';
const PLUGIN_NAME = 'queryEnhancements';
const PPL_SEARCH_STRATEGY = 'ppl';
const SQL_SEARCH_STRATEGY = 'sql';
const SQL_ASYNC_SEARCH_STRATEGY = 'sqlasync';
const PPL_ENDPOINT = '/_plugins/_ppl';
const SQL_ENDPOINT = '/_plugins/_sql';
const BASE_OBSERVABILITY_URI = '/_plugins/_observability';
const BASE_DATACONNECTIONS_URI = '/_plugins/_query/_datasources';
const OPENSEARCH_PANELS_API = {
  OBJECT: `${BASE_OBSERVABILITY_URI}/object`
};
const OPENSEARCH_DATACONNECTIONS_API = {
  DATACONNECTION: `${BASE_DATACONNECTIONS_URI}`
};
const JOBS_ENDPOINT_BASE = '/_plugins/_async_query';
const BASE_ML_COMMONS_URI = '/_plugins/_ml';

// Advanced Settings
const QUERY_ENABLE_ENHANCEMENTS_SETTING = 'query:enableEnhancements';


/***/ }),

/***/ "./common/query_assist/index.ts":
/*!**************************************!*\
  !*** ./common/query_assist/index.ts ***!
  \**************************************/
/*! exports provided: ERROR_DETAILS */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ERROR_DETAILS", function() { return ERROR_DETAILS; });
const ERROR_DETAILS = {
  GUARDRAILS_TRIGGERED: 'guardrails triggered'
};

/***/ }),

/***/ "./common/utils.ts":
/*!*************************!*\
  !*** ./common/utils.ts ***!
  \*************************/
/*! exports provided: formatDate, getFields, removeKeyword */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "formatDate", function() { return formatDate; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getFields", function() { return getFields; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "removeKeyword", function() { return removeKeyword; });
const formatDate = dateString => {
  const date = new Date(dateString);
  return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2) + ' ' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2);
};
const getFields = rawResponse => {
  var _rawResponse$data$sch;
  return (_rawResponse$data$sch = rawResponse.data.schema) === null || _rawResponse$data$sch === void 0 ? void 0 : _rawResponse$data$sch.map((field, index) => {
    var _rawResponse$data$dat;
    return {
      ...field,
      values: (_rawResponse$data$dat = rawResponse.data.datarows) === null || _rawResponse$data$dat === void 0 ? void 0 : _rawResponse$data$dat.map(row => row[index])
    };
  });
};
const removeKeyword = queryString => {
  var _queryString$replace;
  return (_queryString$replace = queryString === null || queryString === void 0 ? void 0 : queryString.replace(new RegExp('.keyword'), '')) !== null && _queryString$replace !== void 0 ? _queryString$replace : '';
};

/***/ }),

/***/ "./public/assets/query_assist_logo.svg":
/*!*********************************************!*\
  !*** ./public/assets/query_assist_logo.svg ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE4LjUgMjMuOTE4NEMxOS4xMzc3IDIzLjY3NTcgMTkuMTIwOCAyMi45MDkyIDE5LjEyMDggMjIuMjgwMlYxOS43NTQ0SDIwLjU3MTRDMjIuNDY1IDE5Ljc1NDQgMjQgMTguMzU3NSAyNCAxNi42MzQzVjUuMTIwMDNDMjQgMy4zOTY4NCAyMi40NjUgMiAyMC41NzE0IDJIMy40Mjg1N0MxLjUzNDk3IDIgMCAzLjM5Njg4IDAgNS4xMjAwM1YxNi42MzQzQzAgMTguMzU3NSAxLjUzNTAyIDE5Ljc1NDQgMy40Mjg1NyAxOS43NTQ0SDEyLjE1MzZMMTcgMjMuMzg1MkMxNy40OTIgMjMuODI3MSAxNy44NjIxIDI0LjE2MSAxOC41IDIzLjkxODRaIiBmaWxsPSIjOTYzQ0JEIi8+CiAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xOC41IDIzLjkxODRDMTkuMTM3NyAyMy42NzU3IDE5LjEyMDggMjIuOTA5MiAxOS4xMjA4IDIyLjI4MDJWMTkuNzU0NEgyMC41NzE0QzIyLjQ2NSAxOS43NTQ0IDI0IDE4LjM1NzUgMjQgMTYuNjM0M1Y1LjEyMDAzQzI0IDMuMzk2ODQgMjIuNDY1IDIgMjAuNTcxNCAySDMuNDI4NTdDMS41MzQ5NyAyIDAgMy4zOTY4OCAwIDUuMTIwMDNWMTYuNjM0M0MwIDE4LjM1NzUgMS41MzUwMiAxOS43NTQ0IDMuNDI4NTcgMTkuNzU0NEgxMi4xNTM2TDE3IDIzLjM4NTJDMTcuNDkyIDIzLjgyNzEgMTcuODYyMSAyNC4xNjEgMTguNSAyMy45MTg0WiIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzY1MDlfNzgwNDMpIi8+CiAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xOC41IDIzLjkxODRDMTkuMTM3NyAyMy42NzU3IDE5LjEyMDggMjIuOTA5MiAxOS4xMjA4IDIyLjI4MDJWMTkuNzU0NEgyMC41NzE0QzIyLjQ2NSAxOS43NTQ0IDI0IDE4LjM1NzUgMjQgMTYuNjM0M1Y1LjEyMDAzQzI0IDMuMzk2ODQgMjIuNDY1IDIgMjAuNTcxNCAySDMuNDI4NTdDMS41MzQ5NyAyIDAgMy4zOTY4OCAwIDUuMTIwMDNWMTYuNjM0M0MwIDE4LjM1NzUgMS41MzUwMiAxOS43NTQ0IDMuNDI4NTcgMTkuNzU0NEgxMi4xNTM2TDE3IDIzLjM4NTJDMTcuNDkyIDIzLjgyNzEgMTcuODYyMSAyNC4xNjEgMTguNSAyMy45MTg0WiIgZmlsbD0idXJsKCNwYWludDFfbGluZWFyXzY1MDlfNzgwNDMpIi8+CiAgPHBhdGggZD0iTTE4LjUwNTEgOS4xNDA2MkMxOC4yMzE3IDkuMTQwNjIgMTguMDEwMSA5LjM2MjIyIDE4LjAxMDEgOS42MzU1NkMxOC4wMTAxIDEzLjcwODQgMTQuNzA4NCAxNy4wMTAxIDEwLjYzNTYgMTcuMDEwMUMxMC4zNjIyIDE3LjAxMDEgMTAuMTQwNiAxNy4yMzE3IDEwLjE0MDYgMTcuNTA1MUMxMC4xNDA2IDE3Ljc3ODQgMTAuMzYyMiAxOCAxMC42MzU2IDE4QzE1LjI1NTEgMTggMTkgMTQuMjU1MSAxOSA5LjYzNTU2QzE5IDkuMzYyMjIgMTguNzc4NCA5LjE0MDYyIDE4LjUwNTEgOS4xNDA2MloiIGZpbGw9IiNGQ0ZFRkYiLz4KICA8cGF0aCBkPSJNMTUuNTE3OCAxMi4zMTI1QzE1Ljk5MzggMTEuNTM2IDE2LjQ1NDEgMTAuNTAwOCAxNi4zNjM1IDkuMDUxMzlDMTYuMTc1OSA2LjA0OTA5IDEzLjQ1NjYgMy43NzE0OSAxMC44ODg5IDQuMDE4MzJDOS44ODM2NiA0LjExNDk1IDguODUxNDkgNC45MzQzMyA4Ljk0MzE5IDYuNDAxOThDOC45ODMwNCA3LjAzOTc4IDkuMjk1MjEgNy40MTYyIDkuODAyNTIgNy43MDU2MUMxMC4yODU0IDcuOTgxMDggMTAuOTA1OCA4LjE1NTU3IDExLjYwOSA4LjM1MzM3QzEyLjQ1ODUgOC41OTIzMSAxMy40NDM5IDguODYwNjggMTQuMjAxMyA5LjQxODhDMTUuMTA5IDEwLjA4NzcgMTUuNzI5NSAxMC44NjMxIDE1LjUxNzggMTIuMzEyNVoiIGZpbGw9IiNGQ0ZFRkYiLz4KICA8cGF0aCBkPSJNNS44NTcyIDcuMDYyNUM1LjM4MTIzIDcuODM4OTUgNC45MjA5MiA4Ljg3NDIzIDUuMDExNDggMTAuMzIzNkM1LjE5OTA4IDEzLjMyNTkgNy45MTgzNyAxNS42MDM1IDEwLjQ4NjEgMTUuMzU2N0MxMS40OTEzIDE1LjI2MDEgMTIuNTIzNSAxNC40NDA3IDEyLjQzMTggMTIuOTczQzEyLjM5MiAxMi4zMzUyIDEyLjA3OTggMTEuOTU4OCAxMS41NzI1IDExLjY2OTRDMTEuMDg5NiAxMS4zOTM5IDEwLjQ2OTIgMTEuMjE5NCA5Ljc2NTk2IDExLjAyMTZDOC45MTY0NSAxMC43ODI3IDcuOTMxMDYgMTAuNTE0MyA3LjE3MzcxIDkuOTU2MkM2LjI2NjAxIDkuMjg3MjggNS42NDU1MSA4LjUxMTg4IDUuODU3MiA3LjA2MjVaIiBmaWxsPSIjRkNGRUZGIi8+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfNjUwOV83ODA0MyIgeDE9IjUwIiB5MT0iLTEwLjI4NTEiIHgyPSIxNS41MyIgeTI9IjI3LjA5NTMiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iI0Y2NTI3NSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNGNjUyNzUiIHN0b3Atb3BhY2l0eT0iMCIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQxX2xpbmVhcl82NTA5Xzc4MDQzIiB4MT0iMTIiIHkxPSIyIiB4Mj0iMTIiIHkyPSIyMy44NDAyIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICAgIDxzdG9wIHN0b3AtY29sb3I9IiMwMEEzRTAiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMDBBM0UwIiBzdG9wLW9wYWNpdHk9IjAiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgo8L3N2Zz4K"

/***/ }),

/***/ "./public/index.scss":
/*!***************************!*\
  !*** ./public/index.scss ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {


switch (window.__osdThemeTag__) {
  case 'v7dark':
    return __webpack_require__(/*! ./index.scss?v7dark */ "./public/index.scss?v7dark");

  case 'v7light':
    return __webpack_require__(/*! ./index.scss?v7light */ "./public/index.scss?v7light");

  case 'v8dark':
    return __webpack_require__(/*! ./index.scss?v8dark */ "./public/index.scss?v8dark");

  case 'v8light':
    return __webpack_require__(/*! ./index.scss?v8light */ "./public/index.scss?v8light");
}

/***/ }),

/***/ "./public/index.scss?v7dark":
/*!**********************************!*\
  !*** ./public/index.scss?v7dark ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var api = __webpack_require__(/*! ../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
            var content = __webpack_require__(/*! !../../../node_modules/css-loader/dist/cjs.js??ref--6-oneOf-0-1!../../../node_modules/postcss-loader/dist/cjs.js??ref--6-oneOf-0-2!../../../node_modules/comment-stripper??ref--6-oneOf-0-3!../../../node_modules/sass-loader/dist/cjs.js??ref--6-oneOf-0-4!./index.scss?v7dark */ "../../node_modules/css-loader/dist/cjs.js?!../../node_modules/postcss-loader/dist/cjs.js?!../../node_modules/comment-stripper/index.js?!../../node_modules/sass-loader/dist/cjs.js?!./public/index.scss?v7dark");

            content = content.__esModule ? content.default : content;

            if (typeof content === 'string') {
              content = [[module.i, content, '']];
            }

var options = {};

options.insert = "head";
options.singleton = false;

var update = api(content, options);



module.exports = content.locals || {};

/***/ }),

/***/ "./public/index.scss?v7light":
/*!***********************************!*\
  !*** ./public/index.scss?v7light ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var api = __webpack_require__(/*! ../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
            var content = __webpack_require__(/*! !../../../node_modules/css-loader/dist/cjs.js??ref--6-oneOf-1-1!../../../node_modules/postcss-loader/dist/cjs.js??ref--6-oneOf-1-2!../../../node_modules/comment-stripper??ref--6-oneOf-1-3!../../../node_modules/sass-loader/dist/cjs.js??ref--6-oneOf-1-4!./index.scss?v7light */ "../../node_modules/css-loader/dist/cjs.js?!../../node_modules/postcss-loader/dist/cjs.js?!../../node_modules/comment-stripper/index.js?!../../node_modules/sass-loader/dist/cjs.js?!./public/index.scss?v7light");

            content = content.__esModule ? content.default : content;

            if (typeof content === 'string') {
              content = [[module.i, content, '']];
            }

var options = {};

options.insert = "head";
options.singleton = false;

var update = api(content, options);



module.exports = content.locals || {};

/***/ }),

/***/ "./public/index.scss?v8dark":
/*!**********************************!*\
  !*** ./public/index.scss?v8dark ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var api = __webpack_require__(/*! ../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
            var content = __webpack_require__(/*! !../../../node_modules/css-loader/dist/cjs.js??ref--6-oneOf-2-1!../../../node_modules/postcss-loader/dist/cjs.js??ref--6-oneOf-2-2!../../../node_modules/comment-stripper??ref--6-oneOf-2-3!../../../node_modules/sass-loader/dist/cjs.js??ref--6-oneOf-2-4!./index.scss?v8dark */ "../../node_modules/css-loader/dist/cjs.js?!../../node_modules/postcss-loader/dist/cjs.js?!../../node_modules/comment-stripper/index.js?!../../node_modules/sass-loader/dist/cjs.js?!./public/index.scss?v8dark");

            content = content.__esModule ? content.default : content;

            if (typeof content === 'string') {
              content = [[module.i, content, '']];
            }

var options = {};

options.insert = "head";
options.singleton = false;

var update = api(content, options);



module.exports = content.locals || {};

/***/ }),

/***/ "./public/index.scss?v8light":
/*!***********************************!*\
  !*** ./public/index.scss?v8light ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var api = __webpack_require__(/*! ../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
            var content = __webpack_require__(/*! !../../../node_modules/css-loader/dist/cjs.js??ref--6-oneOf-3-1!../../../node_modules/postcss-loader/dist/cjs.js??ref--6-oneOf-3-2!../../../node_modules/comment-stripper??ref--6-oneOf-3-3!../../../node_modules/sass-loader/dist/cjs.js??ref--6-oneOf-3-4!./index.scss?v8light */ "../../node_modules/css-loader/dist/cjs.js?!../../node_modules/postcss-loader/dist/cjs.js?!../../node_modules/comment-stripper/index.js?!../../node_modules/sass-loader/dist/cjs.js?!./public/index.scss?v8light");

            content = content.__esModule ? content.default : content;

            if (typeof content === 'string') {
              content = [[module.i, content, '']];
            }

var options = {};

options.insert = "head";
options.singleton = false;

var update = api(content, options);



module.exports = content.locals || {};

/***/ }),

/***/ "./public/index.ts":
/*!*************************!*\
  !*** ./public/index.ts ***!
  \*************************/
/*! exports provided: plugin, QueryEnhancementsPluginSetup, QueryEnhancementsPluginStart */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "plugin", function() { return plugin; });
/* harmony import */ var _index_scss__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./index.scss */ "./public/index.scss");
/* harmony import */ var _index_scss__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_index_scss__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _plugin__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./plugin */ "./public/plugin.tsx");
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./types */ "./public/types.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "QueryEnhancementsPluginSetup", function() { return _types__WEBPACK_IMPORTED_MODULE_2__["QueryEnhancementsPluginSetup"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "QueryEnhancementsPluginStart", function() { return _types__WEBPACK_IMPORTED_MODULE_2__["QueryEnhancementsPluginStart"]; });




// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
function plugin() {
  return new _plugin__WEBPACK_IMPORTED_MODULE_1__["QueryEnhancementsPlugin"]();
}


/***/ }),

/***/ "./public/plugin.tsx":
/*!***************************!*\
  !*** ./public/plugin.tsx ***!
  \***************************/
/*! exports provided: QueryEnhancementsPlugin */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "QueryEnhancementsPlugin", function() { return QueryEnhancementsPlugin; });
/* harmony import */ var moment__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! moment */ "moment");
/* harmony import */ var moment__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(moment__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _src_plugins_opensearch_dashboards_utils_public__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../src/plugins/opensearch_dashboards_utils/public */ "plugin/opensearchDashboardsUtils/public");
/* harmony import */ var _src_plugins_opensearch_dashboards_utils_public__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_src_plugins_opensearch_dashboards_utils_public__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _query_assist__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./query_assist */ "./public/query_assist/index.ts");
/* harmony import */ var _search_ppl_search_interceptor__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./search/ppl_search_interceptor */ "./public/search/ppl_search_interceptor.ts");
/* harmony import */ var _search_sql_search_interceptor__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./search/sql_search_interceptor */ "./public/search/sql_search_interceptor.ts");
/* harmony import */ var _services__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./services */ "./public/services.ts");
/* harmony import */ var _search_sql_async_search_interceptor__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./search/sql_async_search_interceptor */ "./public/search/sql_async_search_interceptor.ts");
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }







class QueryEnhancementsPlugin {
  constructor() {
    _defineProperty(this, "storage", void 0);
    this.storage = new _src_plugins_opensearch_dashboards_utils_public__WEBPACK_IMPORTED_MODULE_1__["Storage"](window.localStorage);
  }
  setup(core, {
    data
  }) {
    const pplSearchInterceptor = new _search_ppl_search_interceptor__WEBPACK_IMPORTED_MODULE_3__["PPLQlSearchInterceptor"]({
      toasts: core.notifications.toasts,
      http: core.http,
      uiSettings: core.uiSettings,
      startServices: core.getStartServices(),
      usageCollector: data.search.usageCollector
    });
    const sqlSearchInterceptor = new _search_sql_search_interceptor__WEBPACK_IMPORTED_MODULE_4__["SQLQlSearchInterceptor"]({
      toasts: core.notifications.toasts,
      http: core.http,
      uiSettings: core.uiSettings,
      startServices: core.getStartServices(),
      usageCollector: data.search.usageCollector
    });
    const sqlAsyncSearchInterceptor = new _search_sql_async_search_interceptor__WEBPACK_IMPORTED_MODULE_6__["SQLAsyncQlSearchInterceptor"]({
      toasts: core.notifications.toasts,
      http: core.http,
      uiSettings: core.uiSettings,
      startServices: core.getStartServices(),
      usageCollector: data.search.usageCollector
    });
    data.__enhance({
      ui: {
        query: {
          language: 'PPL',
          search: pplSearchInterceptor,
          searchBar: {
            queryStringInput: {
              initialValue: 'source=<data_source>'
            },
            dateRange: {
              initialFrom: moment__WEBPACK_IMPORTED_MODULE_0___default()().subtract(2, 'days').toISOString(),
              initialTo: moment__WEBPACK_IMPORTED_MODULE_0___default()().add(2, 'days').toISOString()
            },
            showFilterBar: false,
            extensions: [Object(_query_assist__WEBPACK_IMPORTED_MODULE_2__["createQueryAssistExtension"])(core.http, 'PPL')]
          },
          fields: {
            visualizable: false
          },
          supportedAppNames: ['discover']
        }
      }
    });
    data.__enhance({
      ui: {
        query: {
          language: 'SQL',
          search: sqlSearchInterceptor,
          searchBar: {
            showDatePicker: false,
            showFilterBar: false,
            queryStringInput: {
              initialValue: 'SELECT * FROM <data_source>'
            }
          },
          fields: {
            filterable: false,
            visualizable: false
          },
          showDocLinks: false,
          supportedAppNames: ['discover']
        }
      }
    });
    data.__enhance({
      ui: {
        query: {
          language: 'SQL Async',
          search: sqlAsyncSearchInterceptor,
          searchBar: {
            showDatePicker: false,
            showFilterBar: false,
            queryStringInput: {
              initialValue: 'SHOW DATABASES IN mys3'
            }
          },
          fields: {
            filterable: false,
            visualizable: false
          },
          showDocLinks: false,
          supportedAppNames: ['discover']
        }
      }
    });
    return {};
  }
  start(core, deps) {
    Object(_services__WEBPACK_IMPORTED_MODULE_5__["setStorage"])(this.storage);
    Object(_services__WEBPACK_IMPORTED_MODULE_5__["setData"])(deps.data);
    return {};
  }
  stop() {}
}

/***/ }),

/***/ "./public/query_assist/components/call_outs.tsx":
/*!******************************************************!*\
  !*** ./public/query_assist/components/call_outs.tsx ***!
  \******************************************************/
/*! exports provided: QueryAssistCallOut */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "QueryAssistCallOut", function() { return QueryAssistCallOut; });
/* harmony import */ var _elastic_eui__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @elastic/eui */ "@elastic/eui");
/* harmony import */ var _elastic_eui__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_elastic_eui__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _osd_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @osd/i18n */ "@osd/i18n");
/* harmony import */ var _osd_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_osd_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);



const EmptyIndexCallOut = props => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(_elastic_eui__WEBPACK_IMPORTED_MODULE_0__["EuiCallOut"], {
  "data-test-subj": "query-assist-empty-index-callout",
  title: _osd_i18n__WEBPACK_IMPORTED_MODULE_1__["i18n"].translate('queryAssist.callOut.emptyIndex.title', {
    defaultMessage: 'Select a data source or index to ask a question.'
  }),
  size: "s",
  color: "warning",
  iconType: "iInCircle",
  dismissible: true,
  onDismiss: props.onDismiss
});
const ProhibitedQueryCallOut = props => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(_elastic_eui__WEBPACK_IMPORTED_MODULE_0__["EuiCallOut"], {
  "data-test-subj": "query-assist-guard-callout",
  title: _osd_i18n__WEBPACK_IMPORTED_MODULE_1__["i18n"].translate('queryAssist.callOut.prohibitedQuery.title', {
    defaultMessage: 'I am unable to respond to this query. Try another question.'
  }),
  size: "s",
  color: "danger",
  iconType: "alert",
  dismissible: true,
  onDismiss: props.onDismiss
});
const EmptyQueryCallOut = props => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(_elastic_eui__WEBPACK_IMPORTED_MODULE_0__["EuiCallOut"], {
  "data-test-subj": "query-assist-empty-query-callout",
  title: _osd_i18n__WEBPACK_IMPORTED_MODULE_1__["i18n"].translate('queryAssist.callOut.emptyQuery.title', {
    defaultMessage: 'Enter a natural language question to automatically generate a query to view results.'
  }),
  size: "s",
  color: "warning",
  iconType: "iInCircle",
  dismissible: true,
  onDismiss: props.onDismiss
});
const QueryGeneratedCallOut = props => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(_elastic_eui__WEBPACK_IMPORTED_MODULE_0__["EuiCallOut"], {
  "data-test-subj": "query-assist-query-generated-callout",
  title: `${props.language} ${_osd_i18n__WEBPACK_IMPORTED_MODULE_1__["i18n"].translate('queryAssist.callOut.queryGenerated.title', {
    defaultMessage: `query generated. If there are any issues with the response, try adding more context to the question or a new question to submit.`
  })}`,
  size: "s",
  color: "success",
  iconType: "check",
  dismissible: true,
  onDismiss: props.onDismiss
});
const QueryAssistCallOut = props => {
  switch (props.type) {
    case 'empty_query':
      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(EmptyQueryCallOut, props);
    case 'empty_index':
      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(EmptyIndexCallOut, props);
    case 'invalid_query':
      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(ProhibitedQueryCallOut, props);
    case 'query_generated':
      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(QueryGeneratedCallOut, props);
    default:
      break;
  }
  return null;
};

/***/ }),

/***/ "./public/query_assist/components/index.ts":
/*!*************************************************!*\
  !*** ./public/query_assist/components/index.ts ***!
  \*************************************************/
/*! exports provided: QueryAssistBar */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _query_assist_bar__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./query_assist_bar */ "./public/query_assist/components/query_assist_bar.tsx");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "QueryAssistBar", function() { return _query_assist_bar__WEBPACK_IMPORTED_MODULE_0__["QueryAssistBar"]; });



/***/ }),

/***/ "./public/query_assist/components/query_assist_bar.tsx":
/*!*************************************************************!*\
  !*** ./public/query_assist/components/query_assist_bar.tsx ***!
  \*************************************************************/
/*! exports provided: QueryAssistBar */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "QueryAssistBar", function() { return QueryAssistBar; });
/* harmony import */ var _elastic_eui__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @elastic/eui */ "@elastic/eui");
/* harmony import */ var _elastic_eui__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_elastic_eui__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _src_plugins_opensearch_dashboards_react_public__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../../../src/plugins/opensearch_dashboards_react/public */ "plugin/opensearchDashboardsReact/public");
/* harmony import */ var _src_plugins_opensearch_dashboards_react_public__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_src_plugins_opensearch_dashboards_react_public__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _services__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../services */ "./public/services.ts");
/* harmony import */ var _hooks__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../hooks */ "./public/query_assist/hooks/index.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils */ "./public/query_assist/utils/index.ts");
/* harmony import */ var _call_outs__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./call_outs */ "./public/query_assist/components/call_outs.tsx");
/* harmony import */ var _query_assist_input__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./query_assist_input */ "./public/query_assist/components/query_assist_input.tsx");
/* harmony import */ var _submit_button__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./submit_button */ "./public/query_assist/components/submit_button.tsx");









const QueryAssistBar = props => {
  var _props$dependencies$i;
  const {
    services
  } = Object(_src_plugins_opensearch_dashboards_react_public__WEBPACK_IMPORTED_MODULE_2__["useOpenSearchDashboards"])();
  const inputRef = Object(react__WEBPACK_IMPORTED_MODULE_1__["useRef"])(null);
  const storage = Object(_services__WEBPACK_IMPORTED_MODULE_3__["getStorage"])();
  const persistedLog = Object(react__WEBPACK_IMPORTED_MODULE_1__["useMemo"])(() => Object(_utils__WEBPACK_IMPORTED_MODULE_5__["getPersistedLog"])(services.uiSettings, storage, 'query-assist'), [services.uiSettings, storage]);
  const {
    generateQuery,
    loading
  } = Object(_hooks__WEBPACK_IMPORTED_MODULE_4__["useGenerateQuery"])();
  const [callOutType, setCallOutType] = Object(react__WEBPACK_IMPORTED_MODULE_1__["useState"])();
  const dismissCallout = () => setCallOutType(undefined);
  const selectedIndexPattern = (_props$dependencies$i = props.dependencies.indexPatterns) === null || _props$dependencies$i === void 0 ? void 0 : _props$dependencies$i.at(0);
  const selectedIndex = selectedIndexPattern && (typeof selectedIndexPattern === 'string' ? selectedIndexPattern : selectedIndexPattern.title);
  const previousQuestionRef = Object(react__WEBPACK_IMPORTED_MODULE_1__["useRef"])();
  const onSubmit = async e => {
    var _inputRef$current;
    e.preventDefault();
    if (!((_inputRef$current = inputRef.current) !== null && _inputRef$current !== void 0 && _inputRef$current.value)) {
      setCallOutType('empty_query');
      return;
    }
    if (!selectedIndex) {
      setCallOutType('empty_index');
      return;
    }
    dismissCallout();
    previousQuestionRef.current = inputRef.current.value;
    persistedLog.add(inputRef.current.value);
    const dataSourceId = await Object(_utils__WEBPACK_IMPORTED_MODULE_5__["getMdsDataSourceId"])(services.data.indexPatterns, selectedIndexPattern);
    const params = {
      question: inputRef.current.value,
      index: selectedIndex,
      language: props.language,
      dataSourceId
    };
    const {
      response,
      error
    } = await generateQuery(params);
    if (error) {
      if (error instanceof _utils__WEBPACK_IMPORTED_MODULE_5__["ProhibitedQueryError"]) {
        setCallOutType('invalid_query');
      } else {
        services.notifications.toasts.addError(error, {
          title: 'Failed to generate results'
        });
      }
    } else if (response) {
      services.data.query.queryString.setQuery({
        query: response.query,
        language: params.language
      });
      if (response.timeRange) services.data.query.timefilter.timefilter.setTime(response.timeRange);
      setCallOutType('query_generated');
    }
  };
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(_elastic_eui__WEBPACK_IMPORTED_MODULE_0__["EuiForm"], {
    component: "form",
    onSubmit: onSubmit
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(_elastic_eui__WEBPACK_IMPORTED_MODULE_0__["EuiFormRow"], {
    fullWidth: true
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(_elastic_eui__WEBPACK_IMPORTED_MODULE_0__["EuiFlexGroup"], {
    gutterSize: "s",
    responsive: false,
    alignItems: "center"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(_elastic_eui__WEBPACK_IMPORTED_MODULE_0__["EuiFlexItem"], null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(_query_assist_input__WEBPACK_IMPORTED_MODULE_7__["QueryAssistInput"], {
    inputRef: inputRef,
    persistedLog: persistedLog,
    isDisabled: loading,
    selectedIndex: selectedIndex,
    previousQuestion: previousQuestionRef.current
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(_elastic_eui__WEBPACK_IMPORTED_MODULE_0__["EuiFlexItem"], {
    grow: false
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(_submit_button__WEBPACK_IMPORTED_MODULE_8__["QueryAssistSubmitButton"], {
    isDisabled: loading
  })))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(_call_outs__WEBPACK_IMPORTED_MODULE_6__["QueryAssistCallOut"], {
    language: props.language,
    type: callOutType,
    onDismiss: dismissCallout
  }));
};

/***/ }),

/***/ "./public/query_assist/components/query_assist_input.tsx":
/*!***************************************************************!*\
  !*** ./public/query_assist/components/query_assist_input.tsx ***!
  \***************************************************************/
/*! exports provided: QueryAssistInput */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "QueryAssistInput", function() { return QueryAssistInput; });
/* harmony import */ var _elastic_eui__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @elastic/eui */ "@elastic/eui");
/* harmony import */ var _elastic_eui__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_elastic_eui__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _src_plugins_data_public__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../../../src/plugins/data/public */ "plugin/data/public");
/* harmony import */ var _src_plugins_data_public__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_src_plugins_data_public__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _assets_query_assist_logo_svg__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../assets/query_assist_logo.svg */ "./public/assets/query_assist_logo.svg");
/* harmony import */ var _assets_query_assist_logo_svg__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_assets_query_assist_logo_svg__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _services__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../services */ "./public/services.ts");





const QueryAssistInput = props => {
  var _props$initialValue, _props$inputRef$curre;
  const {
    ui: {
      SuggestionsComponent
    }
  } = Object(_services__WEBPACK_IMPORTED_MODULE_4__["getData"])();
  const [isSuggestionsVisible, setIsSuggestionsVisible] = Object(react__WEBPACK_IMPORTED_MODULE_1__["useState"])(false);
  const [suggestionIndex, setSuggestionIndex] = Object(react__WEBPACK_IMPORTED_MODULE_1__["useState"])(null);
  const [value, setValue] = Object(react__WEBPACK_IMPORTED_MODULE_1__["useState"])((_props$initialValue = props.initialValue) !== null && _props$initialValue !== void 0 ? _props$initialValue : '');
  const sampleDataSuggestions = Object(react__WEBPACK_IMPORTED_MODULE_1__["useMemo"])(() => {
    switch (props.selectedIndex) {
      case 'opensearch_dashboards_sample_data_ecommerce':
        return ['How many unique customers placed orders this week?', 'Count the number of orders grouped by manufacturer and category', 'find customers with first names like Eddie'];
      case 'opensearch_dashboards_sample_data_logs':
        return ['Are there any errors in my logs?', 'How many requests were there grouped by response code last week?', "What's the average request size by week?"];
      case 'opensearch_dashboards_sample_data_flights':
        return ['how many flights were there this week grouped by destination country?', 'what were the longest flight delays this week?', 'what carriers have the furthest flights?'];
      default:
        return [];
    }
  }, [props.selectedIndex]);
  const suggestions = Object(react__WEBPACK_IMPORTED_MODULE_1__["useMemo"])(() => {
    if (!props.persistedLog) return [];
    return props.persistedLog.get().concat(sampleDataSuggestions).filter((suggestion, i, array) => array.indexOf(suggestion) === i && suggestion.includes(value)).map(suggestion => ({
      type: _src_plugins_data_public__WEBPACK_IMPORTED_MODULE_2__["QuerySuggestionTypes"].RecentSearch,
      text: suggestion,
      start: 0,
      end: value.length
    }));
  }, [props.persistedLog, value, sampleDataSuggestions]);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(_elastic_eui__WEBPACK_IMPORTED_MODULE_0__["EuiOutsideClickDetector"], {
    onOutsideClick: () => setIsSuggestionsVisible(false)
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(_elastic_eui__WEBPACK_IMPORTED_MODULE_0__["EuiFieldText"], {
    inputRef: props.inputRef,
    value: value,
    disabled: props.isDisabled,
    onClick: () => setIsSuggestionsVisible(true),
    onChange: e => setValue(e.target.value),
    onKeyDown: () => setIsSuggestionsVisible(true),
    placeholder: props.previousQuestion || (props.selectedIndex ? `Ask a natural language question about ${props.selectedIndex} to generate a query` : 'Select an index pattern to ask a question'),
    prepend: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(_elastic_eui__WEBPACK_IMPORTED_MODULE_0__["EuiIcon"], {
      type: _assets_query_assist_logo_svg__WEBPACK_IMPORTED_MODULE_3___default.a
    }),
    fullWidth: true
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(_elastic_eui__WEBPACK_IMPORTED_MODULE_0__["EuiPortal"], null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement(SuggestionsComponent, {
    show: isSuggestionsVisible,
    suggestions: suggestions,
    index: suggestionIndex,
    onClick: suggestion => {
      if (!props.inputRef.current) return;
      setValue(suggestion.text);
      setIsSuggestionsVisible(false);
      setSuggestionIndex(null);
      props.inputRef.current.focus();
    },
    onMouseEnter: i => setSuggestionIndex(i),
    loadMore: () => {},
    queryBarRect: (_props$inputRef$curre = props.inputRef.current) === null || _props$inputRef$curre === void 0 ? void 0 : _props$inputRef$curre.getBoundingClientRect(),
    size: "s"
  }))));
};

/***/ }),

/***/ "./public/query_assist/components/submit_button.tsx":
/*!**********************************************************!*\
  !*** ./public/query_assist/components/submit_button.tsx ***!
  \**********************************************************/
/*! exports provided: QueryAssistSubmitButton */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "QueryAssistSubmitButton", function() { return QueryAssistSubmitButton; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _elastic_eui__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @elastic/eui */ "@elastic/eui");
/* harmony import */ var _elastic_eui__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_elastic_eui__WEBPACK_IMPORTED_MODULE_1__);


const QueryAssistSubmitButton = props => {
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_elastic_eui__WEBPACK_IMPORTED_MODULE_1__["EuiButtonIcon"], {
    iconType: "returnKey",
    display: "base",
    isDisabled: props.isDisabled,
    size: "s",
    type: "submit",
    "aria-label": "Submit question to query assistant"
  });
};

/***/ }),

/***/ "./public/query_assist/hooks/index.ts":
/*!********************************************!*\
  !*** ./public/query_assist/hooks/index.ts ***!
  \********************************************/
/*! exports provided: useGenerateQuery */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _use_generate__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./use_generate */ "./public/query_assist/hooks/use_generate.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "useGenerateQuery", function() { return _use_generate__WEBPACK_IMPORTED_MODULE_0__["useGenerateQuery"]; });



/***/ }),

/***/ "./public/query_assist/hooks/use_generate.ts":
/*!***************************************************!*\
  !*** ./public/query_assist/hooks/use_generate.ts ***!
  \***************************************************/
/*! exports provided: useGenerateQuery */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "useGenerateQuery", function() { return useGenerateQuery; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _src_plugins_opensearch_dashboards_react_public__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../../../src/plugins/opensearch_dashboards_react/public */ "plugin/opensearchDashboardsReact/public");
/* harmony import */ var _src_plugins_opensearch_dashboards_react_public__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_src_plugins_opensearch_dashboards_react_public__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils */ "./public/query_assist/utils/index.ts");



const useGenerateQuery = () => {
  const mounted = Object(react__WEBPACK_IMPORTED_MODULE_0__["useRef"])(false);
  const [loading, setLoading] = Object(react__WEBPACK_IMPORTED_MODULE_0__["useState"])(false);
  const abortControllerRef = Object(react__WEBPACK_IMPORTED_MODULE_0__["useRef"])();
  const {
    services
  } = Object(_src_plugins_opensearch_dashboards_react_public__WEBPACK_IMPORTED_MODULE_1__["useOpenSearchDashboards"])();
  Object(react__WEBPACK_IMPORTED_MODULE_0__["useEffect"])(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = undefined;
      }
    };
  }, []);
  const generateQuery = async params => {
    var _abortControllerRef$c;
    (_abortControllerRef$c = abortControllerRef.current) === null || _abortControllerRef$c === void 0 || _abortControllerRef$c.abort();
    abortControllerRef.current = new AbortController();
    setLoading(true);
    try {
      var _abortControllerRef$c2;
      const response = await services.http.post('/api/ql/query_assist/generate', {
        body: JSON.stringify(params),
        signal: (_abortControllerRef$c2 = abortControllerRef.current) === null || _abortControllerRef$c2 === void 0 ? void 0 : _abortControllerRef$c2.signal
      });
      if (mounted.current) return {
        response
      };
    } catch (error) {
      if (mounted.current) return {
        error: Object(_utils__WEBPACK_IMPORTED_MODULE_2__["formatError"])(error)
      };
    } finally {
      if (mounted.current) setLoading(false);
    }
    return {};
  };
  return {
    generateQuery,
    loading,
    abortControllerRef
  };
};

/***/ }),

/***/ "./public/query_assist/index.ts":
/*!**************************************!*\
  !*** ./public/query_assist/index.ts ***!
  \**************************************/
/*! exports provided: createQueryAssistExtension */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./public/query_assist/utils/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "createQueryAssistExtension", function() { return _utils__WEBPACK_IMPORTED_MODULE_0__["createQueryAssistExtension"]; });



/***/ }),

/***/ "./public/query_assist/utils/create_extension.tsx":
/*!********************************************************!*\
  !*** ./public/query_assist/utils/create_extension.tsx ***!
  \********************************************************/
/*! exports provided: createQueryAssistExtension */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createQueryAssistExtension", function() { return createQueryAssistExtension; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var ___WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! . */ "./public/query_assist/utils/index.ts");
/* harmony import */ var _services__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../services */ "./public/services.ts");
/* harmony import */ var _components__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../components */ "./public/query_assist/components/index.ts");




const createQueryAssistExtension = (http, language) => {
  return {
    id: 'query-assist',
    order: 1000,
    isEnabled: (() => {
      const agentConfiguredMap = new Map();
      return async dependencies => {
        var _dependencies$dataSou, _dependencies$indexPa;
        // currently query assist tool relies on opensearch API to get index
        // mappings, other data sources are not supported
        if (dependencies.dataSource && ((_dependencies$dataSou = dependencies.dataSource) === null || _dependencies$dataSou === void 0 ? void 0 : _dependencies$dataSou.getType()) !== 'default') return false;
        const dataSourceId = await Object(___WEBPACK_IMPORTED_MODULE_1__["getMdsDataSourceId"])(Object(_services__WEBPACK_IMPORTED_MODULE_2__["getData"])().indexPatterns, (_dependencies$indexPa = dependencies.indexPatterns) === null || _dependencies$indexPa === void 0 ? void 0 : _dependencies$indexPa.at(0));
        const cached = agentConfiguredMap.get(dataSourceId);
        if (cached !== undefined) return cached;
        const configured = await http.get(`/api/ql/query_assist/configured/${language}`, {
          query: {
            dataSourceId
          }
        }).then(response => response.configured).catch(() => false);
        agentConfiguredMap.set(dataSourceId, configured);
        return configured;
      };
    })(),
    getComponent: dependencies => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_components__WEBPACK_IMPORTED_MODULE_3__["QueryAssistBar"], {
      language: language,
      dependencies: dependencies
    })
  };
};

/***/ }),

/***/ "./public/query_assist/utils/errors.ts":
/*!*********************************************!*\
  !*** ./public/query_assist/utils/errors.ts ***!
  \*********************************************/
/*! exports provided: ProhibitedQueryError, formatError */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ProhibitedQueryError", function() { return ProhibitedQueryError; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "formatError", function() { return formatError; });
/* harmony import */ var _common_query_assist__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../common/query_assist */ "./common/query_assist/index.ts");

class ProhibitedQueryError extends Error {
  constructor(message) {
    super(message);
  }
}
const formatError = error => {
  if ('body' in error) {
    if (error.body.statusCode === 429) return {
      ...error.body,
      message: 'Request is throttled. Try again later or contact your administrator'
    };
    if (error.body.statusCode === 400 && error.body.message.includes(_common_query_assist__WEBPACK_IMPORTED_MODULE_0__["ERROR_DETAILS"].GUARDRAILS_TRIGGERED)) return new ProhibitedQueryError(error.body.message);
    return error.body;
  }
  return error;
};

/***/ }),

/***/ "./public/query_assist/utils/get_mds_id.ts":
/*!*************************************************!*\
  !*** ./public/query_assist/utils/get_mds_id.ts ***!
  \*************************************************/
/*! exports provided: getMdsDataSourceId */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getMdsDataSourceId", function() { return getMdsDataSourceId; });
const getMdsDataSourceId = async (indexPatterns, indexPattern) => {
  if (!indexPattern || typeof indexPattern !== 'object' || !indexPattern.id) return undefined;
  return indexPatterns.get(indexPattern.id).then(indexPatternEntity => {
    var _indexPatternEntity$d;
    return (_indexPatternEntity$d = indexPatternEntity.dataSourceRef) === null || _indexPatternEntity$d === void 0 ? void 0 : _indexPatternEntity$d.id;
  });
};

/***/ }),

/***/ "./public/query_assist/utils/get_persisted_log.ts":
/*!********************************************************!*\
  !*** ./public/query_assist/utils/get_persisted_log.ts ***!
  \********************************************************/
/*! exports provided: getPersistedLog */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getPersistedLog", function() { return getPersistedLog; });
/* harmony import */ var _src_plugins_data_common__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../../../src/plugins/data/common */ "plugin/data/common");
/* harmony import */ var _src_plugins_data_common__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_src_plugins_data_common__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _src_plugins_data_public__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../../../src/plugins/data/public */ "plugin/data/public");
/* harmony import */ var _src_plugins_data_public__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_src_plugins_data_public__WEBPACK_IMPORTED_MODULE_1__);


function getPersistedLog(uiSettings, storage, language) {
  return new _src_plugins_data_public__WEBPACK_IMPORTED_MODULE_1__["PersistedLog"](`typeahead:${language}`, {
    maxLength: uiSettings.get(_src_plugins_data_common__WEBPACK_IMPORTED_MODULE_0__["UI_SETTINGS"].HISTORY_LIMIT),
    filterDuplicates: true
  }, storage);
}

/***/ }),

/***/ "./public/query_assist/utils/index.ts":
/*!********************************************!*\
  !*** ./public/query_assist/utils/index.ts ***!
  \********************************************/
/*! exports provided: createQueryAssistExtension, ProhibitedQueryError, formatError, getMdsDataSourceId, getPersistedLog */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _create_extension__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./create_extension */ "./public/query_assist/utils/create_extension.tsx");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "createQueryAssistExtension", function() { return _create_extension__WEBPACK_IMPORTED_MODULE_0__["createQueryAssistExtension"]; });

/* harmony import */ var _errors__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./errors */ "./public/query_assist/utils/errors.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ProhibitedQueryError", function() { return _errors__WEBPACK_IMPORTED_MODULE_1__["ProhibitedQueryError"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "formatError", function() { return _errors__WEBPACK_IMPORTED_MODULE_1__["formatError"]; });

/* harmony import */ var _get_mds_id__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./get_mds_id */ "./public/query_assist/utils/get_mds_id.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "getMdsDataSourceId", function() { return _get_mds_id__WEBPACK_IMPORTED_MODULE_2__["getMdsDataSourceId"]; });

/* harmony import */ var _get_persisted_log__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./get_persisted_log */ "./public/query_assist/utils/get_persisted_log.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "getPersistedLog", function() { return _get_persisted_log__WEBPACK_IMPORTED_MODULE_3__["getPersistedLog"]; });






/***/ }),

/***/ "./public/search/ppl_search_interceptor.ts":
/*!*************************************************!*\
  !*** ./public/search/ppl_search_interceptor.ts ***!
  \*************************************************/
/*! exports provided: PPLQlSearchInterceptor */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PPLQlSearchInterceptor", function() { return PPLQlSearchInterceptor; });
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash */ "lodash");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! rxjs */ "rxjs");
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(rxjs__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _osd_std__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @osd/std */ "../../packages/osd-std/target/web/index.js");
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! rxjs/operators */ "rxjs/operators");
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(rxjs_operators__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _src_plugins_data_common__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../../../src/plugins/data/common */ "plugin/data/common");
/* harmony import */ var _src_plugins_data_common__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_src_plugins_data_common__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _src_plugins_data_public__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../../../src/plugins/data/public */ "plugin/data/public");
/* harmony import */ var _src_plugins_data_public__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_src_plugins_data_public__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _common__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../common */ "./common/index.ts");
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }







class PPLQlSearchInterceptor extends _src_plugins_data_public__WEBPACK_IMPORTED_MODULE_5__["SearchInterceptor"] {
  constructor(deps) {
    super(deps);
    _defineProperty(this, "queryService", void 0);
    _defineProperty(this, "aggsService", void 0);
    deps.startServices.then(([coreStart, depsStart]) => {
      this.queryService = depsStart.data.query;
      this.aggsService = depsStart.data.search.aggs;
    });
  }
  runSearch(request, signal, strategy) {
    var _removeKeyword;
    const {
      id,
      ...searchRequest
    } = request;
    const path = Object(lodash__WEBPACK_IMPORTED_MODULE_0__["trimEnd"])('/api/pplql/search');
    const {
      timefilter
    } = this.queryService;
    const dateRange = timefilter.timefilter.getTime();
    const {
      fromDate,
      toDate
    } = Object(_src_plugins_data_common__WEBPACK_IMPORTED_MODULE_4__["formatTimePickerDate"])(dateRange, 'YYYY-MM-DD HH:mm:ss.SSS');
    const fetchDataFrame = (queryString, df = null) => {
      const body = Object(_osd_std__WEBPACK_IMPORTED_MODULE_2__["stringify"])({
        query: {
          qs: queryString,
          format: 'jdbc'
        },
        df
      });
      return Object(rxjs__WEBPACK_IMPORTED_MODULE_1__["from"])(this.deps.http.fetch({
        method: 'POST',
        path,
        body,
        signal
      }));
    };
    const getTimeFilter = timeField => {
      return ` | where ${timeField === null || timeField === void 0 ? void 0 : timeField.name} >= '${Object(_common__WEBPACK_IMPORTED_MODULE_6__["formatDate"])(fromDate)}' and ${timeField === null || timeField === void 0 ? void 0 : timeField.name} <= '${Object(_common__WEBPACK_IMPORTED_MODULE_6__["formatDate"])(toDate)}'`;
    };
    const getAggQsFn = ({
      qs,
      aggConfig,
      timeField,
      timeFilter
    }) => {
      return Object(_common__WEBPACK_IMPORTED_MODULE_6__["removeKeyword"])(`${qs} ${getAggString(timeField, aggConfig)} ${timeFilter}`);
    };
    const getAggString = (timeField, aggsConfig) => {
      if (!aggsConfig) {
        return ` | stats count() by span(${timeField === null || timeField === void 0 ? void 0 : timeField.name}, ${this.aggsService.calculateAutoTimeExpression({
          from: fromDate,
          to: toDate,
          mode: 'absolute'
        })})`;
      }
      if (aggsConfig.date_histogram) {
        var _ref, _aggsConfig$date_hist;
        return ` | stats count() by span(${timeField === null || timeField === void 0 ? void 0 : timeField.name}, ${(_ref = (_aggsConfig$date_hist = aggsConfig.date_histogram.fixed_interval) !== null && _aggsConfig$date_hist !== void 0 ? _aggsConfig$date_hist : aggsConfig.date_histogram.calendar_interval) !== null && _ref !== void 0 ? _ref : this.aggsService.calculateAutoTimeExpression({
          from: fromDate,
          to: toDate,
          mode: 'absolute'
        })})`;
      }
      if (aggsConfig.avg) {
        return ` | stats avg(${aggsConfig.avg.field})`;
      }
      if (aggsConfig.cardinality) {
        return ` | dedup ${aggsConfig.cardinality.field} | stats count()`;
      }
      if (aggsConfig.terms) {
        return ` | stats count() by ${aggsConfig.terms.field}`;
      }
      if (aggsConfig.id === 'other-filter') {
        const uniqueConfig = Object(_src_plugins_data_common__WEBPACK_IMPORTED_MODULE_4__["getUniqueValuesForRawAggs"])(aggsConfig);
        if (!uniqueConfig || !uniqueConfig.field || !uniqueConfig.values || uniqueConfig.values.length === 0) {
          return '';
        }
        let otherQueryString = ` | stats count() by ${uniqueConfig.field}`;
        uniqueConfig.values.forEach((value, index) => {
          otherQueryString += ` ${index === 0 ? '| where' : 'and'} ${uniqueConfig.field}<>'${value}'`;
        });
        return otherQueryString;
      }
    };
    let queryString = (_removeKeyword = Object(_common__WEBPACK_IMPORTED_MODULE_6__["removeKeyword"])(Object(_src_plugins_data_common__WEBPACK_IMPORTED_MODULE_4__["getRawQueryString"])(searchRequest))) !== null && _removeKeyword !== void 0 ? _removeKeyword : '';
    const dataFrame = Object(_src_plugins_data_common__WEBPACK_IMPORTED_MODULE_4__["getRawDataFrame"])(searchRequest);
    const aggConfig = Object(_src_plugins_data_common__WEBPACK_IMPORTED_MODULE_4__["getAggConfig"])(searchRequest, {}, this.aggsService.types.get.bind(this));
    if (!dataFrame) {
      return fetchDataFrame(queryString).pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_3__["concatMap"])(response => {
        const df = response.body;
        const timeField = Object(_src_plugins_data_common__WEBPACK_IMPORTED_MODULE_4__["getTimeField"])(df, aggConfig);
        const timeFilter = getTimeFilter(timeField);
        Object(_src_plugins_data_common__WEBPACK_IMPORTED_MODULE_4__["updateDataFrameMeta"])({
          dataFrame: df,
          qs: queryString,
          aggConfig,
          timeField,
          timeFilter,
          getAggQsFn: getAggQsFn.bind(this)
        });
        return fetchDataFrame(queryString, df);
      }));
    }
    if (dataFrame) {
      const timeField = Object(_src_plugins_data_common__WEBPACK_IMPORTED_MODULE_4__["getTimeField"])(dataFrame, aggConfig);
      const timeFilter = getTimeFilter(timeField);
      Object(_src_plugins_data_common__WEBPACK_IMPORTED_MODULE_4__["updateDataFrameMeta"])({
        dataFrame,
        qs: queryString,
        aggConfig,
        timeField,
        timeFilter,
        getAggQsFn: getAggQsFn.bind(this)
      });
      queryString += timeFilter;
    }
    return fetchDataFrame(queryString, dataFrame);
  }
  search(request, options) {
    return this.runSearch(request, options.abortSignal, _common__WEBPACK_IMPORTED_MODULE_6__["PPL_SEARCH_STRATEGY"]);
  }
}

/***/ }),

/***/ "./public/search/sql_async_search_interceptor.ts":
/*!*******************************************************!*\
  !*** ./public/search/sql_async_search_interceptor.ts ***!
  \*******************************************************/
/*! exports provided: SQLAsyncQlSearchInterceptor */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SQLAsyncQlSearchInterceptor", function() { return SQLAsyncQlSearchInterceptor; });
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash */ "lodash");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! rxjs */ "rxjs");
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(rxjs__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _osd_std__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @osd/std */ "../../packages/osd-std/target/web/index.js");
/* harmony import */ var _osd_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @osd/i18n */ "@osd/i18n");
/* harmony import */ var _osd_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_osd_i18n__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _src_plugins_data_public__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../../../src/plugins/data/public */ "plugin/data/public");
/* harmony import */ var _src_plugins_data_public__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_src_plugins_data_public__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _src_plugins_data_common__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../../../src/plugins/data/common */ "plugin/data/common");
/* harmony import */ var _src_plugins_data_common__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_src_plugins_data_common__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _common__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../common */ "./common/index.ts");
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }







class SQLAsyncQlSearchInterceptor extends _src_plugins_data_public__WEBPACK_IMPORTED_MODULE_4__["SearchInterceptor"] {
  constructor(deps) {
    super(deps);
    _defineProperty(this, "queryService", void 0);
    _defineProperty(this, "aggsService", void 0);
    _defineProperty(this, "sessionService", void 0);
    deps.startServices.then(([coreStart, depsStart]) => {
      this.queryService = depsStart.data.query;
      this.aggsService = depsStart.data.search.aggs;
      this.sessionService = depsStart.data.search.session;
    });
  }
  runSearch(request, signal, strategy) {
    const {
      id,
      ...searchRequest
    } = request;
    const path = Object(lodash__WEBPACK_IMPORTED_MODULE_0__["trimEnd"])('/api/sqlasyncql/jobs');
    const fetchDataFrame = (queryString, dataSource, df = null) => {
      const body = Object(_osd_std__WEBPACK_IMPORTED_MODULE_2__["stringify"])({
        query: {
          qs: queryString,
          format: 'jdbc'
        },
        dataSource,
        df
      });
      return Object(rxjs__WEBPACK_IMPORTED_MODULE_1__["from"])(this.deps.http.fetch({
        method: 'POST',
        path,
        body,
        signal
      }));
    };
    const rawDataFrame = Object(_src_plugins_data_common__WEBPACK_IMPORTED_MODULE_5__["getRawDataFrame"])(searchRequest);
    const dataFrame = fetchDataFrame(Object(_src_plugins_data_common__WEBPACK_IMPORTED_MODULE_5__["getRawQueryString"])(searchRequest), searchRequest.params.index, rawDataFrame);

    // subscribe to dataFrame to see if an error is returned, display a toast message if so
    dataFrame.subscribe(df => {
      // TODO: MQL Async: clean later
      if (!df.body.error) return;
      const jsError = new Error(df.body.error.response);
      this.deps.toasts.addError(jsError, {
        title: _osd_i18n__WEBPACK_IMPORTED_MODULE_3__["i18n"].translate('queryEnhancements.sqlQueryError', {
          defaultMessage: 'Could not complete the SQL async query'
        }),
        toastMessage: df.body.error.msg
      });
    });
    return dataFrame;
  }
  search(request, options) {
    return this.runSearch(request, options.abortSignal, _common__WEBPACK_IMPORTED_MODULE_6__["SQL_ASYNC_SEARCH_STRATEGY"]);
  }
}

/***/ }),

/***/ "./public/search/sql_search_interceptor.ts":
/*!*************************************************!*\
  !*** ./public/search/sql_search_interceptor.ts ***!
  \*************************************************/
/*! exports provided: SQLQlSearchInterceptor */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SQLQlSearchInterceptor", function() { return SQLQlSearchInterceptor; });
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash */ "lodash");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! rxjs */ "rxjs");
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(rxjs__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _osd_std__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @osd/std */ "../../packages/osd-std/target/web/index.js");
/* harmony import */ var _osd_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @osd/i18n */ "@osd/i18n");
/* harmony import */ var _osd_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_osd_i18n__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _src_plugins_data_public__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../../../src/plugins/data/public */ "plugin/data/public");
/* harmony import */ var _src_plugins_data_public__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_src_plugins_data_public__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _common__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../common */ "./common/index.ts");
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }






class SQLQlSearchInterceptor extends _src_plugins_data_public__WEBPACK_IMPORTED_MODULE_4__["SearchInterceptor"] {
  constructor(deps) {
    super(deps);
    _defineProperty(this, "queryService", void 0);
    _defineProperty(this, "aggsService", void 0);
    deps.startServices.then(([coreStart, depsStart]) => {
      this.queryService = depsStart.data.query;
      this.aggsService = depsStart.data.search.aggs;
    });
  }
  runSearch(request, signal, strategy) {
    const {
      id,
      ...searchRequest
    } = request;
    const path = Object(lodash__WEBPACK_IMPORTED_MODULE_0__["trimEnd"])('/api/sqlql/search');
    const fetchDataFrame = (queryString, df = null) => {
      const body = Object(_osd_std__WEBPACK_IMPORTED_MODULE_2__["stringify"])({
        query: {
          qs: queryString,
          format: 'jdbc'
        },
        df
      });
      return Object(rxjs__WEBPACK_IMPORTED_MODULE_1__["from"])(this.deps.http.fetch({
        method: 'POST',
        path,
        body,
        signal
      }));
    };
    const dataFrame = fetchDataFrame(searchRequest.params.body.query.queries[0].query, searchRequest.params.body.df);

    // subscribe to dataFrame to see if an error is returned, display a toast message if so
    dataFrame.subscribe(df => {
      if (!df.body.error) return;
      const jsError = new Error(df.body.error.response);
      this.deps.toasts.addError(jsError, {
        title: _osd_i18n__WEBPACK_IMPORTED_MODULE_3__["i18n"].translate('dqlPlugin.sqlQueryError', {
          defaultMessage: 'Could not complete the SQL query'
        }),
        toastMessage: df.body.error.msg
      });
    });
    return dataFrame;
  }
  search(request, options) {
    return this.runSearch(request, options.abortSignal, _common__WEBPACK_IMPORTED_MODULE_5__["SQL_SEARCH_STRATEGY"]);
  }
}

/***/ }),

/***/ "./public/services.ts":
/*!****************************!*\
  !*** ./public/services.ts ***!
  \****************************/
/*! exports provided: getStorage, setStorage, getData, setData */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getStorage", function() { return getStorage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setStorage", function() { return setStorage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getData", function() { return getData; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setData", function() { return setData; });
/* harmony import */ var _src_plugins_opensearch_dashboards_utils_common__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../src/plugins/opensearch_dashboards_utils/common */ "plugin/opensearchDashboardsUtils/common");
/* harmony import */ var _src_plugins_opensearch_dashboards_utils_common__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_src_plugins_opensearch_dashboards_utils_common__WEBPACK_IMPORTED_MODULE_0__);

const [getStorage, setStorage] = Object(_src_plugins_opensearch_dashboards_utils_common__WEBPACK_IMPORTED_MODULE_0__["createGetterSetter"])('storage');
const [getData, setData] = Object(_src_plugins_opensearch_dashboards_utils_common__WEBPACK_IMPORTED_MODULE_0__["createGetterSetter"])('data');

/***/ }),

/***/ "./public/types.ts":
/*!*************************!*\
  !*** ./public/types.ts ***!
  \*************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);


/***/ }),

/***/ "@elastic/eui":
/*!***********************************************!*\
  !*** external "__osdSharedDeps__.ElasticEui" ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __osdSharedDeps__.ElasticEui;

/***/ }),

/***/ "@osd/i18n":
/*!********************************************!*\
  !*** external "__osdSharedDeps__.OsdI18n" ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __osdSharedDeps__.OsdI18n;

/***/ }),

/***/ "lodash":
/*!*******************************************!*\
  !*** external "__osdSharedDeps__.Lodash" ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __osdSharedDeps__.Lodash;

/***/ }),

/***/ "moment":
/*!*******************************************!*\
  !*** external "__osdSharedDeps__.Moment" ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __osdSharedDeps__.Moment;

/***/ }),

/***/ "plugin/data/common":
/*!*******************************************!*\
  !*** @osd/bundleRef "plugin/data/common" ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, __webpack_exports__, __webpack_require__) {


      __webpack_require__.r(__webpack_exports__);
      var ns = __osdBundles__.get('plugin/data/common');
      Object.defineProperties(__webpack_exports__, Object.getOwnPropertyDescriptors(ns))
    

/***/ }),

/***/ "plugin/data/public":
/*!*******************************************!*\
  !*** @osd/bundleRef "plugin/data/public" ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, __webpack_exports__, __webpack_require__) {


      __webpack_require__.r(__webpack_exports__);
      var ns = __osdBundles__.get('plugin/data/public');
      Object.defineProperties(__webpack_exports__, Object.getOwnPropertyDescriptors(ns))
    

/***/ }),

/***/ "plugin/opensearchDashboardsReact/public":
/*!****************************************************************!*\
  !*** @osd/bundleRef "plugin/opensearchDashboardsReact/public" ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, __webpack_exports__, __webpack_require__) {


      __webpack_require__.r(__webpack_exports__);
      var ns = __osdBundles__.get('plugin/opensearchDashboardsReact/public');
      Object.defineProperties(__webpack_exports__, Object.getOwnPropertyDescriptors(ns))
    

/***/ }),

/***/ "plugin/opensearchDashboardsUtils/common":
/*!****************************************************************!*\
  !*** @osd/bundleRef "plugin/opensearchDashboardsUtils/common" ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, __webpack_exports__, __webpack_require__) {


      __webpack_require__.r(__webpack_exports__);
      var ns = __osdBundles__.get('plugin/opensearchDashboardsUtils/common');
      Object.defineProperties(__webpack_exports__, Object.getOwnPropertyDescriptors(ns))
    

/***/ }),

/***/ "plugin/opensearchDashboardsUtils/public":
/*!****************************************************************!*\
  !*** @osd/bundleRef "plugin/opensearchDashboardsUtils/public" ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, __webpack_exports__, __webpack_require__) {


      __webpack_require__.r(__webpack_exports__);
      var ns = __osdBundles__.get('plugin/opensearchDashboardsUtils/public');
      Object.defineProperties(__webpack_exports__, Object.getOwnPropertyDescriptors(ns))
    

/***/ }),

/***/ "react":
/*!******************************************!*\
  !*** external "__osdSharedDeps__.React" ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __osdSharedDeps__.React;

/***/ }),

/***/ "rxjs":
/*!*****************************************!*\
  !*** external "__osdSharedDeps__.Rxjs" ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __osdSharedDeps__.Rxjs;

/***/ }),

/***/ "rxjs/operators":
/*!**************************************************!*\
  !*** external "__osdSharedDeps__.RxjsOperators" ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __osdSharedDeps__.RxjsOperators;

/***/ })

/******/ });
//# sourceMappingURL=queryEnhancements.plugin.js.map