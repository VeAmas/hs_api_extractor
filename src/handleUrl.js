// @ts-check
const { resolve } = require('path')
const fs = require('fs')
const Env = require('./env')

/**
 * 处理引用文件的路径
 * @param {string} baseFileUrl 引用文件的路径
 * @param {string} offset 被引用文件的路径
 * @returns {string | undefined}
 */
module.exports = function handleUrl(baseFileUrl, offset) {
  baseFileUrl = baseFileUrl.replace(/\\/g, '/').trim()
  offset = offset.trim()
  const baseDir = (baseFileUrl.match(/(^.*\/)[^/]*$/) || ['', ''])[1] || ''
  if (!baseDir) return

  /** node_module */
  if (offset.indexOf('/') === -1) {
    /** TODO: node_modules */
  } else {
    const alias = offset.match(/([^/]*)\//)[1]
    const rest = offset.substr(alias.length + 1)

    let dir = ''
    let fileName = ''
    /** 根目录 */
    if (alias === '' || alias === '@') {
      dir = Env.ROOT_PATH + 'src/' + rest

      /** 相对定位 */
    } else if (alias === '.' || alias === '..') {
      dir = resolve(baseDir, alias + '/' + rest).replace(/\\/g, '/')

      /** 别名 */
    } else if (Env.ALIAS_LIST[alias]) {
      dir = resolve(
        Env.ROOT_PATH,
        './' + Env.ALIAS_LIST[alias] + '/' + rest
      ).replace(/\\/g, '/')

      /** node_modules */
    } else {
      /** TODO: node_modules */
    }

    let dirMatched = false
    const dirVue = dir + '.vue'
    const dirJs = dir + '.js'

    const state = fs.existsSync(dir) && fs.statSync(dir)
    if (state && state.isFile()) {
      return dir
    } else if (state && state.isDirectory()) {
      dirMatched = true
    }
    const stateJs = fs.existsSync(dirJs) && fs.statSync(dirJs)
    const stateVue = fs.existsSync(dirVue) && fs.statSync(dirVue)

    if (stateJs && stateJs.isFile()) {
      return dirJs
    }
    if (stateVue && stateVue.isFile()) {
      return dirVue
    }

    if (dirMatched) {
      const dirIndexJs = dir + '/index.js'
      const dirIndexVue = dir + '/index.vue'

      const stateIndexJs = fs.existsSync(dirIndexJs) && fs.statSync(dirIndexJs)
      const stateIndexVue =
        fs.existsSync(dirIndexVue) && fs.statSync(dirIndexVue)

      if (stateIndexJs && stateIndexJs.isFile()) {
        return dirIndexJs
      }
      if (stateIndexVue && stateIndexVue.isFile()) {
        return dirIndexVue
      }
    }
  }
}
