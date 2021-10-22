// @ts-check

const Env = require('./env')
const exportGraph = require('./exportGraph')
const handleFile = require('./handleFile')

// const getHuiConfig = require('./getHuiConfig')

// const huiConfig = getHuiConfig(path)
// console.log(huiConfig.alias)

// const code = String(fs.readFileSync(resolve(__dirname, './index.vue')))

// handleFile(Env.ROOT_PATH + 'src/index.js')
handleFile(
  // 'D:/SVN/RPAS/risk-rpas-basic-ui/src/hsfundFuncanal/router/modules/customized.js'
  // 'D:/SVN/RPAS/risk-rpas-basic-ui/src/hsfundFuncanal/mixins/getPagePorp.js'
  // 'D:/SVN/RPAS/risk-rpas-basic-ui/src/hsfundFuncanal/api/modules/personalize/portTrial.js'
  'D:/SVN/RPAS/risk-rpas-basic-ui/src/hsfundFuncanal/test.js'
)

exportGraph()

module.exports = '123'
