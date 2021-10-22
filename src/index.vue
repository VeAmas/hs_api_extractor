<template>
  <div id="correlation-analysis" class="fais-customized-std-fn">
    <query-components
      ref="queryComponents"
      v-model="parameterQueryValue"
      :estimate-param-size="8"
      :parameter-list="componentConfig.componentParameter"
      @get-data="doQuery"
    ></query-components>

    <div class="table-panel">
      <div class="table-title">
        <div class="title">相关性分析</div>
        <div class="tool-box">
          <div class="tool" style="display: flex; align-items: center">
            <h-switch
              v-model="showColor"
              size="small"
              style="transform: scale(0.7)"
            ></h-switch>
            <span @click="showColor = !showColor"> 展示颜色 </span>
          </div>
          <index-statement
            class="tool"
            :index-list="originIndexes"
          ></index-statement>
          <index-config
            v-model="componentConfig.componentIndex"
            class="tool"
            :origin-indexes="originIndexes"
            @input="updateColumns"
          ></index-config>
        </div>
      </div>
      <div class="table-wrapper" :class="{ 'no-color': !showColor }">
        <huge-data-table
          ref="hugeDataTable"
          :height="tableHeight"
        ></huge-data-table>
        <div class="legend">
          <div class="legend-items">
            <div
              class="legend-item"
              style="border: solid 1px #000; background: #fffdfa"
            >
              <span>最小值</span>
            </div>
            <div class="legend-item" style="background: #ffcfa1">
              <span>0</span>
            </div>
            <div class="legend-item" style="background: #ff7773">
              <span>最大值</span>
            </div>
          </div>
          <div class="gradient"></div>
        </div>
      </div>
    </div>

    <progress-bar ref="progressBar"></progress-bar>
  </div>
</template>

<script>
// @ts-check
import { gradientColors } from './gradientColors.js';
import QueryComponents from '../../components/QueryComponents/index.vue';
import hugeDataTable from '../../components/SimpleTreeTable/hugeDataTable.vue';
import IndexConfig from '../../components/IndexConfig/index.vue';
import IndexStatement from '../../components/IndexStatement/index.vue';
import ProgressBar from '../../components/ProgressBar/index.vue';
import { setIndexValue } from '../../scripts/utils.js';

import { componentData, getMockData, SavedData } from './mock.js';
import { CorrWorker } from '../../scripts/workers/correlationWorker.js';

/**
 * @typedef {import('../../type').StdFnCfg} StdFnCfg
 * @typedef {import('../../type').SavedParameterQueryValue} SavedParameterQueryValue
 * @typedef {import('../../type').StdFnTableColumn} StdFnTableColumn
 *
 * @typedef {InstanceType<typeof hugeDataTable>} hugeDataTable
 * @typedef {InstanceType<typeof ProgressBar>} ProgressBar
 */

/** 用于展示表格值的颜色 */
const colors = [
  ...gradientColors('#FFFDFA', '#FFCFA1', 128),
  ...gradientColors('#FFCFA1', '#FF7773', 128)
];

export default {
  name: 'correlation-analysis',
  components: {
    QueryComponents,
    hugeDataTable,
    IndexConfig,
    IndexStatement,
    ProgressBar
  },
  data() {
    const data = {
      /** @type {StdFnCfg} 组件配置信息 */
      componentConfig: {
        componentId: '',
        componentName: '',
        componentParameter: [],
        componentIndex: []
      },
      /** @type {StdFnCfg['componentIndex']} 系统默认的指标列表 */
      originIndexes: [],
      /** @type {{[key: string]: {value: any, title: string}}} 查询参数 */
      parameterQueryValue: {},
      /** @type {StdFnTableColumn[]} */
      columns: [],
      /** @type {{scode: string, sname: string}[]} 筛选条件中的指数列表 */
      indexList: [],
      /** 是否显示颜色 */
      showColor: true,
      /** @type {CorrWorker} */
      worker: null,

      tableHeight: 0
    };
    /** @type {{$refs?: {hugeDataTable: hugeDataTable, progressBar: ProgressBar}} & typeof data} */
    const _data = data;
    return _data;
  },
  watch: {
    showColor() {
      this.resizeTable();
    }
  },
  methods: {
    getSavedParameterQueryValue() {
      return new Promise(rev => {
        setTimeout(() => {
          rev(SavedData);
        }, 500);
      });
    },
    doQuery() {
      try {
        /** @type {string[]} */
        const list = JSON.parse(this.parameterQueryValue.IndexSearch.value);
        this.indexList = list.map(v => ({
          scode: v.split('-')[0],
          sname: v.split('-')[1]
        }));
      } catch (e) {
        this.indexList = [
          {
            scode: '000300SH',
            sname: '沪深300'
          }
        ];
      }

      this.getData();
    },
    updateColumns() {
      this.columns = this.componentConfig.componentIndex
        .filter(v => v.selected)
        .map((v, j) => {
          /** @type {StdFnTableColumn} */
          const column = {
            dataField: v.indexId,
            allowSorting: true,
            caption: v.indexName,
            alignment: 'left',
            sortingMethod(v1, v2) {
              const n1 = parseFloat(v1);
              const n2 = parseFloat(v2);
              if (isNaN(n1) || isNaN(n2)) {
                return String(v1).localeCompare(String(v2));
              }
              return n1 - n2;
            },
            cellTemplate: 'cellTemplateWithStyle'
          };

          if (j === 0) {
            column.cellTemplate = 'cellTemplateClickable';
            return column;
          }
          column.alignment = 'center';
          column.columns = this.indexList.map(u => ({
            dataField: column.dataField + '-' + u.scode,
            allowSorting: true,
            caption: u.sname,
            align: 'left',
            unit: '0',
            precision: '2',
            sortingMethod: (v1, v2) => {
              return (
                Number(v1.replace(/,/g, '')) - Number(v2.replace(/,/g, ''))
              );
            },
            cellTemplate: 'cellTemplateWithStyle'
          }));
          return column;
        });

      this.$refs.hugeDataTable.setColumns(this.columns);
    },
    getData() {
      this.$refs.progressBar.toModal();

      this.updateColumns();

      const indexListPlain = [
        this.columns[0],
        ...this.columns.map(v => v.columns || []).flat()
      ];

      const data = getMockData(indexListPlain);

      console.time('calc');

      this.worker
        .calc(
          indexListPlain.map(v => ({
            dataField: v.dataField,
            caption: v.caption
          })),
          data,
          colors
        )
        .then(res => {
          console.log('处理数据用时:');
          console.timeEnd('calc');

          this.$refs.hugeDataTable.setData(res);

          this.$refs.progressBar.clear();
        });
    },
    /** 获取当前组件的详情 */
    getCurComponent() {
      /**
       * @returns {Promise<StdFnCfg>}
       */
      const getComponent = () =>
        new Promise(rev =>
          window.setTimeout(() => {
            rev(componentData);
          }, 1000)
        );

      Promise.all([getComponent(), this.getSavedParameterQueryValue()]).then(
        ([component, savedParameterQueryValue]) => {
          this.componentConfig = component;

          this.originIndexes = this.componentConfig.componentIndex.map(v => ({
            ...v
          }));

          setIndexValue(
            savedParameterQueryValue,
            this.componentConfig.componentIndex
          );

          this.updateColumns();

          if (savedParameterQueryValue.param) {
            this.$nextTick(() => {
              this.parameterQueryValue = savedParameterQueryValue.param;
            });
          }
        }
      );
    },
    exportExcel() {
      /** */
    },
    updateColumn(value) {
      this.indicationList = value[0].value_info.filter(v => v.isSelected);
      this.updateColumns();
    },
    resizeTable() {
      const offset = this.showColor ? 108 : 14;
      /** @type {HTMLDivElement} */
      const dom = this.$el.querySelector('.table-wrapper');
      this.tableHeight = dom.offsetHeight - 10 - offset;
    },
    initResizeObserver() {
      this.ro = new ResizeObserver(() => {
        this.resizeTable();
      });
      this.ro.observe(this.$el.querySelector('.table-wrapper'));
    },
    clearResizeObserver() {
      this.ro.disconnect();
    }
  },
  mounted() {
    this.getCurComponent();
    this.initResizeObserver();

    this.worker = new CorrWorker();
  },
  destroyed() {
    this.clearResizeObserver();
  }
};
</script>

<style lang="scss" scoped>
@import '../../styles/common.scss';

.table-toolbar {
  p .h-btn {
    padding: 4px 8px;
    min-width: auto;
    line-height: 14px;
  }
}

.hide-parameter,
.show-parameter {
  .h-icon {
    vertical-align: baseline;
    display: inline-block;
    font-size: 12px;
  }
}
.show-parameter {
  .h-icon {
    transform: rotate(180deg);
  }
}
.table-wrapper /deep/ .table-cell-with-color {
  display: block;
  width: calc(100% + 12px);
  height: 24px;
  line-height: 24px;
  padding: 0 6px;
  margin: -3px -6px;
}
.table-wrapper /deep/ {
  .dx-row-focused,
  .dx-state-hover {
    .table-cell-with-color {
      filter: brightness(0.9);
    }
  }
}

.no-color.table-wrapper /deep/ .table-cell-with-color {
  background: transparent !important;
  filter: none;
}

.legend {
  width: 415px;
  margin: 28px;
  margin-bottom: 0;
  float: right;
  .legend-items {
    display: flex;
    justify-content: space-between;
    .legend-item {
      width: 25px;
      height: 25px;
      position: relative;
      span {
        position: absolute;
        display: block;
        box-sizing: border-box;
        left: -10px;
        right: -10px;
        top: -20px;
        white-space: nowrap;
        text-align: center;
      }
    }
  }
  .gradient {
    height: 20px;
    margin-top: 20px;
    background: linear-gradient(
      to right,
      #fffdfa 0%,
      #ffcfa1 50%,
      #ff7773 100%
    );
  }
}
</style>
