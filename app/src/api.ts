import SerialPort from 'serialport'
import { EventEmitter } from 'events'
import { IDataResponse, IAllData, IScan, IIdentity, IScanResponse, IIdentityResponse } from './interfaces'

const Readline = require('@serialport/parser-readline')

const baudRate = 115200

async function findPortPath() {
  const ports = await SerialPort.list()

  return ports.find(port => port.comName.includes('usbserial')).comName
}

function toScan({ timestamp, isMatching, ...rest }: IScanResponse) {
  return {
    ...rest,
    timestamp: new Date(Number(timestamp)),
    isMatching: isMatching === 'true',
  }
}

export function toId({ timestamp, ...rest }: IIdentityResponse) {
  return {
    timestamp: new Date(timestamp),
    ...rest,
  }
}

export default class API extends EventEmitter {
  private port = findPortPath().then(path => new SerialPort(path, { baudRate }))
  private parser = new Readline()

  constructor() {
    super()

    this.port.then(port => {
      port.pipe(this.parser)

      this.parser.on('data', (line: string) => {
        try {
          const { type, ...payload } = JSON.parse(line)

          this.emit(type, payload)
        } catch (error) {
          console.warn(line)
        }
      })
    })
  }

  async getAll(): Promise<IAllData> {
    const { history, ids } = await this.fetch<IDataResponse>('get')
    return {
      history: history.map(toScan),
      ids: ids.map(toId),
    }
  }

  toggleRegister(): Promise<IScan> {
    return this.fetch('toggleRegister')
  }

  register(id: IIdentityResponse) {
    return this.fetch('register', id)
  }

  deleteUuid(uuid: string) {
    return this.fetch('deleteUuid', { uuid })
  }

  syncTime() {
    return this.fetch('syncTime', { milliseconds: +new Date() })
  }

  onScan(cb: (scan: IScan) => void) {
    this.on('scan', (scan: IScanResponse) => {
      cb(toScan(scan))
    })
  }

  private fetch<T>(type: string, data?: {}): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(reject, 2000)

      const port = await this.port

      port.write(JSON.stringify({ type, ...data }))
      this.once(type, data => {
        clearTimeout(timeout)
        resolve(data)
      })
    })
  }
}