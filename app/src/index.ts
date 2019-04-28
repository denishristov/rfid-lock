import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { join } from 'path'
import API from './api'

let mainWindow: BrowserWindow

const api = new API()

ipcMain.on('get', async (event: any) => {
	const data = await api.getAll()
	event.sender.send('get', data)
})

function createWindow() {	
	mainWindow = new BrowserWindow({
		height: 600,
		width: 800,
	})

	mainWindow.loadFile(join(__dirname, '../public/index.html'))

	// mainWindow.webContents.openDevTools()

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
