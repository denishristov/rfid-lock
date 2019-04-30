export interface IDataResponse {
  history: IScanResponse[]
  ids: IIdentityResponse[]
}

export interface IScan {
  uuid: string
  isMatching: boolean
  timestamp: Date
}

export interface IScanResponse {
  uuid: string
  isMatching: string
  timestamp: string
}

export interface IIdentityResponse {
  name: string
  image: string
  uuid: string
  timestamp: string
}


export interface IIdentity {
  name: string
  image: string
  uuid: string
  timestamp: Date
}
export interface IAllData {
  history: IScan[]
  ids: IIdentity[]
}