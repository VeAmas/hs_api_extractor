// @ts-check

const { resolve } = require('path')
const Env = require('./env')
const fs = require('fs')

module.exports = function exportGraph() {
  /** @type {Map<string, number>} */
  const nodeNameMap = new Map()
  Env.fileList.forEach((v, i) => nodeNameMap.set(v.path, i))
  const data = Env.fileList.map((v, i) => ({
    name: v.fileName,
    id: i,
    category: v.extension,
    path: v.path,
    symbolSize: v.code.length / 1000
  }))
  const links = Env.referList.map(v => ({
    source: nodeNameMap.get(v.source),
    target: nodeNameMap.get(v.target)
  }))

  const series = JSON.stringify(
    {
      type: 'graph',
      symbolSize: 50,
      labelLayout: {
        hideOverlap: true
      },
      roam: true,
      layout: 'force',
      label: {
        show: true
      },
      edgeSymbol: ['circle', 'arrow'],
      edgeSymbolSize: [4, 10],
      edgeLabel: {
        fontSize: 20
      },
      data,
      links,
      force: {
        repulsion: 1,
        edgeLength: 200
      }
    },
    null,
    2
  )

  const exportContent = `
    option = {
      title: {
        text: 'Basic Graph'
      },
      tooltip: {
        formatter (data) {
          
          return \`<div>
          \${data.name}
          <br/>
          \${data.data.path}
          </div>\`
        }
      },
      animationDurationUpdate: 1500,
      animationEasingUpdate: 'quinticInOut',
      series: [
        ${series}
      ]
    };    
    `

  fs.writeFileSync(resolve(__dirname, './export.json'), exportContent)
}
