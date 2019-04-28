import { createElement, forwardRef, useState } from 'react'
import { IIdentity } from './interfaces'

interface IProps {
  uuid: string
  create(id: IIdentity): void
  close(): void
}

const icons = [
  'charmander',
  'bulbasaur',
  'squirtle',
  'kirby',
  'ash',
  'pokeball',
  'mario',
]

function IDModal({ uuid, create, close }: IProps, ref: React.Ref<HTMLDialogElement>) {
  const [name, setName] = useState('')
  const [image, setImage] = useState(icons[0])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.stopPropagation()

    create({
      name,
      image,
      uuid,
      timestamp: new Date().toISOString()
    })
  }

  return (
    <dialog className="nes-dialog is-rounded" ref={ref}>
      <form method="dialog" onSubmit={handleSubmit}>
        <p className="title">Add new identity</p>
        <p>
          UUID: <span className={`nes-text is-${uuid ? 'success' : 'warning'}`}>
            {uuid || 'Approximate your card to the reader'}
          </span>
        </p>
        <div className="nes-field">
          <label>Name</label>
          <input 
            type="text" 
            className={`nes-input is-${name ? 'success' : 'warning'}`} 
            value={name} 
            onChange={e => setName(e.target.value)} 
          />
        </div>
        <label>Image</label>
        <section className="icon-list">
          {icons.map(icon => (
            <i 
              key={icon} 
              className={`nes-${icon} ${image === icon ? 'selected' : ''}`} 
              onClick={() => setImage(icon)}
            />
          ))}
        </section>
        <menu className="dialog-menu">
          <button type='button' className="nes-btn" onClick={close}>Cancel</button>
          <button 
            type="submit" 
            disabled={!uuid} 
            className={`nes-btn is-${uuid ? 'success' : 'disabled'}`}
          >
            Confirm
          </button>
        </menu>
      </form>
    </dialog>
  )
}

export default forwardRef(IDModal)
