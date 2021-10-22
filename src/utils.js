// @ts-check
const Env = require('./env')

/**
 * 判断一个引用是否为API
 * @param {import('@babel/types').ImportDeclaration} node
 * @returns {{localName: string; api: import('./type').ExportedApi}[]}
 */
module.exports.isApi = function isApi(node) {
  /**
   * TODO: 这里需要改成配置项
   * 暂时定为 @fais/tzjc-comps
   */

  /**
   * 如果直接引入API 则判断是否引入了httpCamel, httpUnderline
   */
  if (node.source.value === '@fais/tzjc-comps') {
    const exportApiList = node.specifiers
      .map(v => {
        /** 引入成员元素 默认引用肯定不是 */
        if (v.type === 'ImportSpecifier' && v.imported.type === 'Identifier') {
          if (
            v.imported.name === 'httpCamel' ||
            v.imported.name === 'httpUnderline'
          ) {
            return {
              localName: v.local.name,
              api: {
                specifierName: v.imported.name,
                path: '@fais/tzjc-comps',
                referChain: []
              }
            }
          }
        }
      })
      .filter(v => v)

    return exportApiList
  }

  const exportValues = Env.fileExportMap.get(node.source.value)

  if (exportValues && exportValues.length > 0) {
    /** @type {string[][]} 引入的属性列表, 具名则为[local, imported], 匿名则为[local] */
    const importedNameList = node.specifiers
      .map(v => {
        if (v.type === 'ImportSpecifier' && v.imported.type === 'Identifier') {
          return [v.local.name, v.imported.name]
        } else if (v.type === 'ImportDefaultSpecifier') {
          return [v.local.name]
        }
      })
      .filter(v => v)

    return exportValues
      .map(v => {
        let target
        if (v.exported.type === 'Identifier') {
          const exported = v.exported
          /** 如果是默认导出, 且该导出被引入过 */
          if (
            !exported.name &&
            (target = importedNameList.find(u => u.length === 1))
          ) {
            return {
              localName: target[0],
              api: v.api
            }

            /** 如果是具名导出, 且该导出被引入过 */
          } else {
            target = importedNameList.find(u => u[1] === exported.name)
            return {
              localName: target[0],
              api: v.api
            }
          }
        }
      })
      .filter(v => v)
  }

  return []
}

/**
 * 获取后缀名(例如 '.js')
 * @param {string} str 文件名
 * @returns {string}
 */
module.exports.getExtension = function getExtension(str) {
  return (str.match(/\.[^.]*$/) || [''])[0].trim().toLowerCase()
}
