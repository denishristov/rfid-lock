import { app, BrowserWindow, dialog } from 'electron'
import { join } from 'path'

import SerialPort from 'serialport'
const Readline = require('@serialport/parser-readline')

const path = '/dev/cu.usbserial-1410'
const port = new SerialPort(path, { baudRate: 115200 })
const parser = new Readline()

port.pipe(parser)
// port.write('ROBOT POWER ON\n')

let mainWindow: BrowserWindow

parser.on('data', (line: string) => console.log(`> ${line}`))

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

