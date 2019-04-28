import { ipcRenderer } from "electron"
import { useEffect } from 'react'

export function useController<T>(type: string, data?: {}, cb?: (data: T) => void) {
  useEffect(() => {
    ipcRenderer.once(type, (event: any, data: T) => cb(data))
    ipcRenderer.send(type, data)
  }, [])
}