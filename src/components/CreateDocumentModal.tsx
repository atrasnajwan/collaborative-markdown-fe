import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material'
import React, { useState } from 'react'

type CreateDocumentModalProps = {
  open: boolean
  handleCreateDocument: (e: React.FormEvent, title: string) => Promise<void>
  onClose: () => {}
}
const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  open,
  handleCreateDocument,
  onClose,
}) => {
  const [title, setTitle] = useState('')
  const [isCreating, setIsCreating] = useState<boolean>(false)

  const handleOnChange = (e: any) => {
    setTitle(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    await handleCreateDocument(e, title)
      .then(() => setTitle(''))
      .finally(() => setIsCreating(false))
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <div className="">
        <DialogTitle>Create New Document</DialogTitle>

        <DialogContent>
          <form onSubmit={handleSubmit} id="create-form">
            {/* <input
                      type="text"
                      value={title}
                      onChange={handleOnChange}
                      placeholder="Document title"
                      className="w-full p-2 rounded-md bg-bg-primary border border-accent-primary/20 text-text-primary mb-4"
                      disabled={isCreating}
                    /> */}
            <TextField
              onChange={handleOnChange}
              autoFocus
              required
              margin="dense"
              id="title"
              name="title"
              label="Title"
              fullWidth
              variant="standard"
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            form="create-form"
            disabled={isCreating || !title.trim()}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </div>
    </Dialog>
  )
}

export default CreateDocumentModal
