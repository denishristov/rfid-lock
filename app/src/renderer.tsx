import { useState, createElement, Fragment, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useController, sendToController } from './util'
import { IAllData, IScan, IIdentity } from './interfaces'
import IDModal from './IDModal'
import { format } from 'timeago.js'
import DeleteModal from './DeleteModal';

function App() {
	const [history, setHistory] = useState<IScan[]>([])
	const [ids, setIds] = useState<IIdentity[]>([])
	const [uuid, setUuid] = useState('')
	const [modalKey, setModalKey] = useState(0)
	const [deleting, setDeleting] = useState({ name: '', uuid: '' })

	const ref = useRef<HTMLDialogElement>()
	const deleteModalRef = useRef<HTMLDialogElement>()

	function register(id: IIdentity) {
		sendToController('register', id)
		setIds(ids => [id, ...ids])
		setModalKey(key => key + 1)
		setUuid('')
	}

	function openModal() {
		ref.current.showModal()
		sendToController('toggleRegister')
	}

	function closeModal() {
		ref.current.close()
		sendToController('toggleRegister')
		setModalKey(key => key + 1)
		setUuid('')
	}

	function openDeleteModal(name: string, uuid: string) {
		deleteModalRef.current.showModal()
		setDeleting({ name, uuid })
	}

	function closeDeleteModal() {
		deleteModalRef.current.close()
		setModalKey(key => key + 1)
	}

	function deleteUuid(uuid: string) {
		sendToController('deleteUuid', uuid)
		setIds(ids => ids.filter(id => id.uuid !== uuid))
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

	console.log(history.map(x => new Date(x.timestamp)))

	return (
		<Fragment>
			<div className="nes-container with-title is-rounded">
				<p className="title">History</p>
				<div className='entries'>
					{history.map(scan => (
						<div className='col' key={scan.timestamp}>
							<p className={`nes-text is-${scan.isMatching ? 'success' : 'error'}`}>{scan.uuid}</p>
							<p className='nes-text is-disabled'>{format(new Date(scan.timestamp))}</p>
						</div>
					))}
				</div>
			</div>
			<div className="nes-container with-title is-rounded">
				<p className="title">Identities</p>
				<div className='entries'>
					{ids.map(({ uuid, name, image, timestamp }) => (
						<div className='uuid' key={uuid} onClick={() => openDeleteModal(name, uuid)}>
							<i className={`nes-${image} is-small`} />
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
					key={'c' + modalKey}
					ref={ref} 
					uuid={uuid} 
					create={register} 
					close={closeModal} 
				/>
				<DeleteModal
					key={'d' + modalKey}
					ref={deleteModalRef}
					name={deleting.name}
					uuid={deleting.uuid}
					deleteUuid={deleteUuid}
					close={closeDeleteModal}
				/>
			</div>
		</Fragment>
	)
}	

ReactDOM.render(<App />, document.getElementById('root'))
