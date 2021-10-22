// @ts-check
import { ExportSpecifier } from '@babel/types'

export type ExportedApi = {
  specifierName: string
  path: string
  /** 该API在该文件是否被触发过 */
  triggered: boolean
  referChain: ExportedApi[]
}
export type ExportApiDeclaration = ExportSpecifier & { api?: ExportedApi }
export type FileInfo = {
  code: string
  path: string
  extension: string
  fileName: string
}

export type Env = {
  ROOT_PATH: string
  ALIAS_LIST: { [key: string]: string }
  fileExportMap: Map<string, ExportApiDeclaration[]>
  loadedFileMap: Map<string, FileInfo>
  fileList: FileInfo[]
  referList: {
    source: string
    target: string
  }[]
}
