import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import API from './api'
import { IIdentity } from './interfaces'

let mainWindow: BrowserWindow

const api = new API()

ipcMain
	.on('get', async (event: any) => {
		const data = await api.getAll()
		event.sender.send('get', data)
	})
	.on('toggleRegister', async (event: any) => {
		const data = await api.toggleRegister()
		event.sender.send('toggleRegister', data)
	})
	.on('register', (_: void, id: IIdentity) => {
		api.register(id)
	})
	.on('deleteUuid', (_: void, uuid: string) => {
		api.deleteUuid(uuid)
	})

function createWindow() {	
	mainWindow = new BrowserWindow({
		height: 800,
		width: 1000,
		frame: false,
		titleBarStyle: 'hidden'
	})

	mainWindow.loadFile(join(__dirname, '../public/index.html'))

	mainWindow.webContents.on('did-finish-load', () => {
		['scan'].forEach((type) => {
			api.on(type, (data) => {
				mainWindow.webContents.send(type, data)
			})
		})
	})

	mainWindow.on('closed', () => {
		mainWindow = null
	})
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (mainWindow === null) {
		createWindow()
	}
})
