import { createElement, forwardRef, useState } from 'react'
import { IIdentity } from './interfaces';
import { create } from 'domain';

interface IProps {
  uuid: string
  create: (id: IIdentity) => void
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

function IDModal({ uuid, create }: IProps, ref: React.Ref<HTMLDialogElement>) {
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
        <p className="title">Approximate your card to the reader</p>
        {uuid && <p>UUID: {uuid}</p>}
        <div className="nes-field">
          <label>Your name</label>
          <input 
            type="text" 
            className="nes-input" 
            value={name} 
            onChange={e => setName(e.target.value)} 
          />
        </div>
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
          <button className="nes-btn">Cancel</button>
          <button type="submit" className="nes-btn is-primary">Confirm</button>
        </menu>
      </form>
    </dialog>
  )
}

export default forwardRef(IDModal)
