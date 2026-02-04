import React from "react"
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, List, ListItem, ListItemText, MenuItem, Select, Stack, TextField, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import { api, Collaborator, User, UserRole } from "../services/api"
import { red } from "@mui/material/colors"

type ShareDocumentModalProps = {
  open: boolean
  onClose: () => void
  documentId: number
}

const ShareDocumentModal: React.FC<ShareDocumentModalProps> = ({
  open,
  documentId,
  onClose,
}) => {

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<User[]>([])
  const [loading, setLoading] = useState({search: false, add: false, change: false, delete: false})
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [role, setRole] = useState<Map<number,UserRole>>(new Map())
  const [sharedUserIds, setSharedUserIds] = useState<Set<number>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false)
  const [userToDelete, setUserToDelete] = useState<Collaborator>()

  useEffect(() => {
    if (!documentId) return
    
    api.getDocumentCollaborators(documentId)
        .then((c) => {
          setCollaborators(c)
        }).catch((err) => console.log(err))
  
  }, [documentId])

  useEffect(() => {
    const currRoles = new Map<number, UserRole>()
    collaborators.forEach(val => currRoles.set(val.user.id, val.role as UserRole))
    setSharedUserIds(new Set<number>(currRoles.keys()))
    setRole(currRoles)
  }, [collaborators])

  // debounce search
  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(prev => ({...prev, search: true}))
      try {
        const users = await api.searchUser(query)
        setResults(users)
      } catch(err) {
        console.log(err)
      } finally {
         setLoading(prev => ({...prev, search: false}))
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const onChangeRole = (e: any, userId: number) => setRole(prev => new Map([...prev, [userId, e.target.value]]))


  const handleAddCollaborator = async (userId: number) => {
    const newRole = role.get(userId) || UserRole.Editor
     setLoading(prev => ({...prev, add: true}))
      try {
        const collaborator = await api.addDocumentCollaborator(documentId, userId, newRole)
        setCollaborators(prev => ([...prev, collaborator]))
      } catch(err) {
        console.log(err)
      } finally {
         setLoading(prev => ({...prev, add: false}))
      }
  }

  const handleChangeRole = async (userId: number) => {
    const newRole = role.get(userId)
    const currUser = collaborators.find(c => c.user.id == userId)
    if (newRole == UserRole.None) {
        setUserToDelete(currUser)
        setDeleteConfirmOpen(true)
    } else {
      if (!newRole || !currUser || newRole === currUser?.role) return
  
       setLoading(prev => ({...prev, change: true}))
        try {
          await api.changeCollaboratorRole(documentId, userId, newRole)
        } catch(err) {
          setRole(prev => new Map([...prev, [userId, currUser.role as UserRole]])) // rollback role
          console.log(err)
        } finally {
           setLoading(prev => ({...prev, change: false}))
        }
    }
  }

  const handleDeleteUserAccess = async () => {
    if (!userToDelete) return
    setLoading(prev => ({...prev, delete: true}))
        try {
          await api.removeDocumentCollaborator(documentId, userToDelete.user.id)
          const updatedItems = collaborators.filter(collaborator => collaborator.user.id !== userToDelete.user.id)
          setCollaborators(updatedItems)
        } catch(err) {
          console.log(err)
        } finally {
          setDeleteConfirmOpen(false)
          setLoading(prev => ({...prev, delete: false}))
        }
  }
  return (
    <>
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Share document</DialogTitle>

      <DialogContent>
        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search by email or name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          margin="normal"
        />

        {/* Search results */}
        {loading.search && <CircularProgress size={20} />}

        {!loading.search && results.length > 0 && (
          <List dense>
            {results.map(user => (
              <ListItem key={user.id} divider>
                <ListItemText
                  primary={user.name}
                  secondary={user.email}
                />
                <ListItem
                  secondaryAction={
                  sharedUserIds.has(user.id) ? (
                    <Typography variant="caption" color="text.secondary">
                      Already added
                    </Typography>
                  ) : (
                    <Stack direction="row" spacing={1}>
                      <Select
                        size="small"
                        value={role.get(user.id) || UserRole.Editor}
                        onChange={(e) => onChangeRole(e, user.id)}
                      >
                        <MenuItem value={UserRole.Editor}>Editor</MenuItem>
                        <MenuItem value={UserRole.Viewer}>Viewer</MenuItem>
                      </Select>

                      <Button
                        size="small"
                        variant="contained"
                        disabled={loading.add}
                        onClick={() => handleAddCollaborator(user.id)}
                      >
                        Add
                      </Button>
                    </Stack>
                  )}
                  disablePadding
                />
              </ListItem>
            ))}
          </List>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Current collaborators */}
        <Typography variant="subtitle2" gutterBottom>
          Shared with
        </Typography>

        <List dense>
          {collaborators.map((collaborator) => (
            <ListItem key={collaborator.user.id}>
              <ListItemText
                primary={collaborator.user.name}
                secondary={collaborator.user.email}
              />
              {
                collaborator.role === UserRole.Owner ? (
                <Typography variant="body2" color="text.secondary">
                  {collaborator.role}
                </Typography>
                ) : (
                  <Stack direction="row" spacing={1}>
                      <Select
                        size="small"
                        value={role.get(collaborator.user.id)}
                        onChange={(e) => onChangeRole(e, collaborator.user.id)}
                      >
                        <MenuItem value={UserRole.Editor}>Editor</MenuItem>
                        <MenuItem value={UserRole.Viewer}>Viewer</MenuItem>
                        <Divider />
                        <MenuItem sx={{ color: red[500] }} value={UserRole.None}>Remove Access</MenuItem>
                      </Select>

                      <Button
                        size="small"
                        variant="contained"
                        loading={loading.change}
                        loadingPosition="end"
                        onClick={() => handleChangeRole(collaborator.user.id)}
                      >
                        Confirm
                      </Button>
                  </Stack>
                )
              }
              
            </ListItem>
          ))}
        </List>
      </DialogContent>
       <DialogActions>
          <Button autoFocus onClick={onClose}>
            Done
          </Button>
        </DialogActions>
        
    </Dialog>
    {
      userToDelete && (
        <DeleteAccessDialog
          open={deleteConfirmOpen}
          user={userToDelete}
          onClose={() => setDeleteConfirmOpen(false)}
          loading={loading.delete}
          onConfirm={handleDeleteUserAccess}
        />
      )
    }
    </>
  )
}

type DeleteAccessDialogProps = {
  open: boolean
  user: Collaborator
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}
const DeleteAccessDialog: React.FC<DeleteAccessDialogProps> = ({open, user, onClose, onConfirm, loading}) => (
  <Dialog
        open={open}
        onClose={onClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {
              `Do you really want to remove ${user.user.name} (${user.user.email}) to access this document?`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} autoFocus>Not really</Button>
          <Button
            onClick={onConfirm}
            sx={{ color: red[500] }}
            loading={loading}
            loadingPosition="end"
          >Yeah, I'm sure</Button>
        </DialogActions>
      </Dialog>
)
export default ShareDocumentModal
