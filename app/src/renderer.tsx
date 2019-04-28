import { useState, createElement, Fragment } from 'react'
import ReactDOM from 'react-dom'
import { useController } from './util'
import { IAllData, IScan } from './interfaces'

function Counter() {
	const [data, setData] = useState<IAllData>({ history: [], ids: [] })

	useController('get', void 0, setData)
	useController<IScan>('scan', void 0, scan => {
		setData(data => ({
			...data,
			history: [scan, ...data.history]
		}))
	})

	return (
		<Fragment>
			<div className="nes-container with-title is-rounded">
				<p className="title">History</p>
				<div className='entries'>
					{data.history.map(scan => (
						<div className={`nes-text is-${scan.isMatching ? 'success' : 'error'}`}>
							<p>{scan.uuid}</p>
						</div>
					))}
				</div>
			</div>
			<div className="nes-container with-title is-rounded">
				<p className="title">Registered UUIDs</p>
				{data.ids.map(uuid => (
					<div className='uuid' key={uuid}>
						<p>{uuid}</p>
					</div>
				))}
				<button type="button" className="nes-btn is-success">Add new</button>
			</div>
		</Fragment>
	)
}	

ReactDOM.render(<Counter />, document.getElementById('root'))
