// @ts-check
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const handleUrl = require('./handleUrl')
const { getExtension, isApi } = require('./utils')
const Env = require('./env')
const handleFile = require('./handleFile')

/**
 * 处理js文件
 * @param {import("./type").FileInfo} fileInfo
 */
module.exports = function handleJS(fileInfo) {
  const ast = parser.parse(fileInfo.code, {
    sourceType: 'module'
  })

  /**
   * @type {{
   *   localName: string;
   *   api: import('./type').ExportedApi;
   * }[]}
   */
  let importedApiList = []

  // /**
  //  * @param {import("@babel/types").VariableDeclarator} node
  //  * @param {typeof importedApiList} apis
  //  */
  // function apiDeclationHandler(node, apis) {
  //   node.tra
  // }

  traverse(ast, {
    /** import表达式 */
    ImportDeclaration(path) {
      const referencePath = handleUrl(fileInfo.path, path.node.source.value)
      // console.log(path.node.source.value + ' => ' + referencePath)
      if (
        referencePath &&
        ['.js', '.vue'].includes(getExtension(referencePath))
      ) {
        Env.referList.push({ source: fileInfo.path, target: referencePath })
        handleFile(referencePath)
      }
      importedApiList = isApi(path.node)
      if (importedApiList.length > 0) {
        console.log('API: ' + importedApiList.map(v => v.localName).join(', '))
      }
    },
    enter(path) {
      /** 动态import (() => import(...)) */
      if (
        path.node.type === 'CallExpression' &&
        path.node.callee.type === 'Import'
      ) {
        const argument0 = path.node.arguments[0]
        if (argument0.type === 'TemplateLiteral') {
          const referencePath = handleUrl(
            fileInfo.path,
            argument0.quasis[0].value.raw
          )
          // console.log(argument0.quasis[0].value.raw + ' => ' + referencePath)
          if (
            referencePath &&
            ['.js', '.vue'].includes(getExtension(referencePath))
          ) {
            Env.referList.push({ source: fileInfo.path, target: referencePath })
            handleFile(referencePath)
          }
        }
      }

      if (
        path.node.type === 'CallExpression' ||
        path.node.type === 'OptionalCallExpression'
      ) {
        let topName = ''
        const callee = path.node.callee
        if (callee.type === 'Identifier') {
          topName = callee.name
        } else if (callee.type === 'MemberExpression') {
          let object = callee.object
          while (object.type !== 'Identifier') {
            object = /** @type {import('@babel/types').MemberExpression}  */ (
              object
            ).object
          }
          topName = object.name
        }

        if (importedApiList.find(v => v.localName === topName)) {
          let scope = path.scope
          let subScope = null
          while (scope.parent) {
            if (scope.bindings[topName]) return
            subScope = scope
            scope = scope.parent
          }

          if (subScope) {
            /** 如果二级scope直接是一个具名导出 */
            if (
              subScope.path.parent.type === 'ExportNamedDeclaration' &&
              subScope.block.type === 'FunctionDeclaration'
            ) {
              console.log(subScope.block.id.name)
              /** 是一个匿名导出 */
            } else if (
              subScope.path.parent.type === 'ExportDefaultDeclaration'
            ) {
              console.log('default')
              /** 是一个属性定义 */
            } else if (
              subScope.path.parent.type === 'VariableDeclarator' &&
              subScope.path.parent.id.type === 'Identifier'
            ) {
              console.log(subScope.path.parent.id.name)
            } else if (subScope.block.type === 'ObjectMethod') {
              let p = subScope.path
              while (p && p.type !== 'VariableDeclarator') {
                p = p.parentPath
              }
              if (
                p.node.type === 'VariableDeclarator' &&
                p.node.id.type === 'Identifier'
              ) {
                console.log(p.node.id.name)
              }
            }
          } else {
            /** NOTE: 这个说明topName是在最顶层调用的, 所有导出都会执行 */
          }
        }
      }

      // if (
      //   importedApiList.length > 0 &&
      //   path.node.type === 'VariableDeclarator' &&
      //   path.node.init &&
      //   path.node.init.type === 'Identifier'
      // ) {
      //   const initor = path.node.init
      //   let api
      //   if ((api = importedApiList.find(v => v.localName === initor.name))) {
      //     apiDeclationHandler(path.node, [...importedApiList, api])
      //     path.scope.ha
      //   }
      // }
    }
    // FunctionDeclaration(path) {
    //   console.log(path.scope)
    // },
    // ObjectMethod(path) {
    //   console.log(path.scope)
    // },
  })
}
