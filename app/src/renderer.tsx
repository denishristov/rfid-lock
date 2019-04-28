import { useState, createElement, Fragment, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useController, sendToController } from './util'
import { IAllData, IScan, IIdentity } from './interfaces'
import IDModal from './IDModal'
import { format } from 'timeago.js'

function App() {
	const [history, setHistory] = useState<IScan[]>([])
	const [ids, setIds] = useState<IIdentity[]>([])
	const [uuid, setUuid] = useState('')
	const [modalKey, setModalKey] = useState(0)

	const ref = useRef<HTMLDialogElement>()

	function register(id: IIdentity) {
		sendToController('register', id)
		setIds(ids => [id, ...ids])
	}

	function openModal() {
		ref.current.showModal()
		sendToController('toggleRegister')
	}

	function closeModal() {
		ref.current.close()
		sendToController('toggleRegister')
		setModalKey(key => key + 1)
	}

	useController<IAllData>('get', ({ history, ids }) => {
		setIds(ids)
		setHistory(history)
	})

	useController<IScan>('scan', scan => {
		if (ref.current.open && !uuid) {
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
				<div className='entries'>
					{ids.map(({ uuid, name, image, timestamp }) => (
						<div className='uuid' key={uuid}>
							<i className={`nes-${image} is-small` } />
							<span>
								<p className='nes-text'>{name}</p>
								<p className='nes-text is-disabled'>{uuid}</p>
								<p className='nes-text is-disabled'>{format(new Date(timestamp))}</p>
							</span>
						</div>
					))}
				</div>
				<button onClick={openModal} className="nes-btn is-success">
					Add
				</button>
				<IDModal
					key={modalKey}
					ref={ref} 
					uuid={uuid} 
					create={register} 
					close={closeModal} 
				/>
			</div>
		</Fragment>
	)
}	

ReactDOM.render(<App />, document.getElementById('root'))
