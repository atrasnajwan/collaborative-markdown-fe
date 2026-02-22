import React, { useState, useEffect } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material'

type RenameDocumentModalProps = {
  open: boolean
  initialTitle: string
  handleRenameDocument: (_e: React.FormEvent, _title: string) => Promise<void>
  onClose: () => void
}

const RenameDocumentModal: React.FC<RenameDocumentModalProps> = ({
  open,
  initialTitle,
  handleRenameDocument,
  onClose,
}) => {
  const [title, setTitle] = useState(initialTitle)
  const [isRenaming, setIsRenaming] = useState<boolean>(false)

  useEffect(() => {
    setTitle(initialTitle)
  }, [initialTitle])

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    await handleRenameDocument(e, title)
      .then(() => setTitle(''))
      .finally(() => setIsRenaming(false))
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <div className="">
        <DialogTitle>Rename Document</DialogTitle>

        <DialogContent>
          <form onSubmit={handleSubmit} id="rename-form">
            <TextField
              value={title}
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
            form="rename-form"
            disabled={isRenaming || !title.trim()}
          >
            {isRenaming ? 'Renaming...' : 'Rename'}
          </Button>
        </DialogActions>
      </div>
    </Dialog>
  )
}

export default RenameDocumentModal
