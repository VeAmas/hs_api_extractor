// @ts-check

module.exports = handleFile

const Env = require('./env')
const handleJS = require('./handleJS')
const handleVue = require('./handleVue')
const fs = require('fs')
const { getExtension } = require('./utils')

/**
 * 处理单个文件
 * @param {string} path 文件路径
 */
function handleFile(path) {
  if (Env.loadedFileMap.has(path)) return

  console.log(path)

  const extension = getExtension(path)
  // @ts-ignore
  const code = String(fs.readFileSync(path))
  const fileName = path.split('/').pop()

  /** @type {import('./type').FileInfo}  */
  const fileInfo = {
    path,
    code,
    extension,
    fileName
  }

  Env.fileList.push(fileInfo)

  Env.loadedFileMap.set(path, fileInfo)

  switch (extension) {
    case '.js':
      handleJS(fileInfo)
      break
    case '.vue':
      handleVue(fileInfo)
      break
    default:
      return
  }
}
