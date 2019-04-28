import { useState, createElement, Fragment, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useController, sendToController } from './util'
import { IAllData, IScan, IIdentity } from './interfaces'
import IDModal from './IDModal'

function App() {
	const [history, setHistory] = useState<IScan[]>([])
	const [ids, setIds] = useState<IIdentity[]>([])
	const [uuid, setUuid] = useState('')

	const ref = useRef<HTMLDialogElement>()

	function register(id: IIdentity) {
		sendToController<IScan>('register', id)
		setIds(ids => [id, ...ids])
	}

	async function openModal() {
		ref.current.showModal()
		const { uuid } = await sendToController<IScan>('toggleRegister')
		setUuid(uuid)
	}

	useController<IAllData>('get', ({ history, ids }) => {
		setIds(ids)
		setHistory(history)
	})

	useController<IScan>('scan', scan => {
		if (ref.current.open) {
			setUuid(scan.uuid)
		} else {
			setHistory(history => [scan, ...history])
		}
	})

	return (
		<Fragment>
			<div className="nes-container with-title is-rounded">
				<p className="title">History</p>
				<div className='entries'>
					{history.map(scan => (
						<div className={`nes-text is-${scan.isMatching ? 'success' : 'error'}`}>
							<p>{scan.uuid}</p>
						</div>
					))}
				</div>
			</div>
			<div className="nes-container with-title is-rounded">
				<p className="title">Identities</p>
				{ids.map(({ uuid, name, image, timestamp }) => (
					<div className='uuid' key={uuid}>
						<i className={`nes-${image}`} />
						<p>{name}</p>
						<p>{uuid}</p>
						<p>{timestamp}</p>
					</div>
				))}
				<button onClick={openModal} className="nes-btn is-success">
					Add
				</button>
				<IDModal ref={ref} uuid={uuid} create={register} />
			</div>
		</Fragment>
	)
}	

ReactDOM.render(<App />, document.getElementById('root'))
