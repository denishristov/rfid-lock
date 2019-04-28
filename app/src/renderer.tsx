import { useState, createElement, Fragment } from 'react'
import ReactDOM from 'react-dom'
import { useController } from './util'
import { IAllData } from './interfaces'

function Counter() {
	const [data, setData] = useState<IAllData>({ history: [], ids: [] })
	useController('get', void 0, setData)

	return (
		<Fragment>
			<span>
				{data.history.map(scan => (
					<div>
						<h1>{scan.uuid}</h1>
						<h2>{scan.isMatching}</h2>
					</div>
				))}
			</span>
			<span>
				{data.ids.map(uuid => (
					<h1 key={uuid}>{uuid}</h1>
				))}
			</span>
		</Fragment>
	)
}	

ReactDOM.render(<Counter />, document.getElementById('root'))
