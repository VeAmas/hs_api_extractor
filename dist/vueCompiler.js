"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = require("path");
var vue_eslint_parser_1 = __importDefault(require("vue-eslint-parser"));
var code = String(fs_1.default.readFileSync(path_1.resolve(__dirname, "./index.vue")));
// const code = `
//  <scirpt>
//   export default {
//     name: 'component'
//   }
//  </scirpt>
//  `;
var vueAst = vue_eslint_parser_1.default.parse(code, {
    sourceType: "module",
    ecmaVersion: 2018,
    ecmaFeatures: {
        globalReturn: false,
        impliedStrict: false,
        jsx: false,
    },
});
console.log(vueAst);
exports.default = "123";
