export interface IDataResponse {
  history: string[]
  ids: string[]
}

export interface IScan {
  uuid: string
  isMatching: boolean
}

export interface IAllData {
  history: IScan[]
  ids: string[]
}