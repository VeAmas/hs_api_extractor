/** @type {import('./type').Env}  */
const Env = {
  ROOT_PATH: 'D:/SVN/RPAS/risk-rpas-basic-ui/',
  ALIAS_LIST: {
    '@biz': 'src',
    '@hsfundFuncanal': 'src/hsfundFuncanal'
  },
  fileExportMap: new Map(),
  loadedFileMap: new Map(),
  fileList: [],
  referList: []
}

module.exports = Env
