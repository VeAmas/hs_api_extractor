// @ts-check
const { parse, AST } = require('vue-eslint-parser')
const Env = require('./env')
const handleFile = require('./handleFile')
const handleUrl = require('./handleUrl')
const { getExtension } = require('./utils')

/**
 * 处理Vue文件
 * @param {import("./type").FileInfo} fileInfo
 */
module.exports = function handleVue(fileInfo) {
  const vueAst = parse(fileInfo.code, {
    sourceType: 'module',
    ecmaVersion: 2020,
    ecmaFeatures: {
      globalReturn: false,
      impliedStrict: false,
      jsx: true
    }
  })

  try {
    AST.traverseNodes(vueAst, {
      // visitorKeys: ['FunctionExpression', 'ImportDeclaration'],
      enterNode(node) {
        if (node.type === 'ImportDeclaration') {
          const referencePath = handleUrl(
            fileInfo.path,
            /** @type {string}  */ (node.source.value)
          )
          // console.log(node.source.value + ' => ' + referencePath)

          if (
            referencePath &&
            ['.js', '.vue'].includes(getExtension(referencePath))
          ) {
            Env.referList.push({ source: fileInfo.path, target: referencePath })
            handleFile(referencePath)
          }
        }
      },
      leaveNode() {}
    })
  } catch (e) {
    console.error(e)
  }
}
