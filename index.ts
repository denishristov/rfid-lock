import SerialPort from 'serialport'
const Readline = require('@serialport/parser-readline')

const path = '/dev/cu.usbserial-1410'
const port = new SerialPort(path, { baudRate: 115200 })
const parser = new Readline()

port.pipe(parser)

parser.on('data', (line: string) => console.log(`> ${line}`))
// port.write('ROBOT POWER ON\n')