import { ipcRenderer } from "electron"
import { useEffect } from 'react'

export function useController<T>(type: string, cb?: (data: T) => void) {
  useEffect(() => {
    ipcRenderer.on(type, (event: any, data: T) => cb(data))
    ipcRenderer.send(type)
  }, [])
}

export function sendToController<T>(type: string, data?: {}): Promise<T> {
  return new Promise(resolve => {
    ipcRenderer.once(type, (event: any, data: T) => resolve(data))
    ipcRenderer.send(type, data)
  })
}