import SerialPort from 'serialport'
import { EventEmitter } from 'events'
import { IDataResponse, IAllData } from './interfaces'
import { ipcMain } from 'electron';
const Readline = require('@serialport/parser-readline')

const path = '/dev/cu.usbserial-1410'
const baudRate = 115200

export default class API extends EventEmitter {
  private port = new SerialPort(path, { baudRate })
  private parser = new Readline()

  constructor() {
    super()

    this.port.pipe(this.parser)
    this.parser.on('data', (line: string) => {
      const { type, ...payload } = JSON.parse(line)

      this.emit(type, payload)
    })
  }

  async getAll(): Promise<IAllData> {
    const { ids, history } = await this.fetch<IDataResponse>('get')

    return { 
      ids,
      history: history.map(scan => JSON.parse(scan))
    }
  }

  private fetch<T>(type: string, data?: {}): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(reject, 2000)

      this.port.write(JSON.stringify({ type, ...data }))
      this.once(type, data => {
        clearTimeout(timeout)
        resolve(data)
      })
    })
  }
}