// @ts-check

const fs = require('fs')
const huiConfigUrl = 'hui.config.js'
const babel = require('babel-core')

/**
 * @type {(baseUrl: string) => {
 *   id: string;
 *   type: string;
 *   autoRouting: boolean;
 *   base: string;
 *   publicPath: string;
 *   mode: string;
 *   cssModules: boolean;
 *   plugins: string[];
 *   alias: {[key: string]: string}
 *   proxy: {[key: string]: {
 *     target: string;
 *     changeOrigin: boolean;
 *     onProxyReq(proxyReq: any, req: any): void;
 *   }}
 *   see: {
 *       systemType: string;
 *       appType: string;
 *   };
 *   libs: {};
 *   vuex: boolean;
 * }}
 */
const getHuiConfig = baseUrl => {
  const configFile = String(fs.readFileSync(baseUrl + huiConfigUrl))

  /** @type {babel.Visitor} */
  const visitor = {
    Identifier(path) {
      if (path.node.name === 'exports') {
        const exportPath = path.parentPath.parentPath
        const exportNode = /** @type {babel.types.AssignmentExpression} */ (
          exportPath.node
        ).right

        const root = /** @type {object[]} */ (exportPath.parentPath.container)

        const index = root.indexOf(exportPath.parent)

        root[index] = {
          type: 'ReturnStatement',
          argument: exportNode
        }
      }
    }
  }

  const exportsContent = babel.transform(configFile, {
    plugins: [{ visitor }]
  })

  const fn = new Function('require, __dirname', exportsContent.code)
  const res = fn(
    () => ({
      resolve(a, b) {
        return a + b
      }
    }),
    baseUrl
  )

  return res
}

module.exports = getHuiConfig
