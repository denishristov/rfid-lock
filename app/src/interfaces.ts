export interface IDataResponse {
  history: string[]
  ids: IIdentity[]
}

export interface IScan {
  uuid: string
  isMatching: boolean
}

export interface IIdentity {
  name: string
  image: string
  uuid: string
  timestamp: string
}

export interface IAllData {
  history: IScan[]
  ids: IIdentity[]
}