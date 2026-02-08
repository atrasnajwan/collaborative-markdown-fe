import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material'
import { red } from '@mui/material/colors'

type DeleteDialogProps = {
  open: boolean
  description: string
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open,
  description,
  onClose,
  onConfirm,
  loading,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description"
  >
    <DialogContent>
      <DialogContentText id="alert-dialog-description">
        {description}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} autoFocus>
        Not really
      </Button>
      <Button
        onClick={onConfirm}
        sx={{ color: red[500] }}
        loading={loading}
        loadingPosition="end"
      >
        Yeah, I'm sure
      </Button>
    </DialogActions>
  </Dialog>
)

export default DeleteDialog
