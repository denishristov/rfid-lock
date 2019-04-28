import { forwardRef, createElement } from 'react'

interface IProps {
  name: string
  uuid: string
  deleteUuid(uuid: string): void
  close(): void
}

function DeleteModal({ deleteUuid, name, uuid, close }: IProps, ref: React.Ref<HTMLDialogElement>) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.stopPropagation()

    deleteUuid(uuid)
  }

  return (
    <dialog className="nes-dialog is-rounded is-dark" ref={ref}>
      <form method="dialog" onSubmit={handleSubmit}>
        <p className="title">Do you wish to delete {name}?</p>
        <menu className="dialog-menu">
          <button type='button' className="nes-btn" onClick={close}>Cancel</button>
          <button 
            type="submit"
            className='nes-btn is-error'
          >
            Confirm
          </button>
        </menu>
      </form>
    </dialog>
  )
}


export default forwardRef(DeleteModal)