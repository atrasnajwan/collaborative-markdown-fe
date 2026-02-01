import React from "react"
import { Button, CircularProgress, Dialog, DialogContent, DialogTitle, Divider, List, ListItem, ListItemSecondaryAction, ListItemText, MenuItem, Select, Stack, TextField, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import { api, Collaborator, User, UserRole } from "../services/api"
import { error } from "console"

type ShareDocumentModalProps = {
  open: boolean
  onClose: () => void
  documentId: number
  collaborators: Collaborator[]
}


const ShareDocumentModal: React.FC<ShareDocumentModalProps> = ({
  open,
  documentId,
  onClose,
  collaborators = []
}) => {

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<UserRole>(UserRole.Editor)

  const sharedUserIds = new Set(collaborators.map(c => c.user.id))

  // debounce search
  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const users = await api.searchUser(query)
        setResults(users)
      } catch(err) {
        console.log(err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleAddCollaborator = async (userId: number, role: UserRole) => {
    setLoading(true)
      try {
        const collaborator = await api.addDocumentCollaborator(documentId, userId, role)
        sharedUserIds.add(collaborator.user.id)
      } catch(err) {
        console.log(err)
      } finally {
        setLoading(false)
      }
  }

  return (
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
        {loading && <CircularProgress size={20} />}

        {!loading && results.length > 0 && (
          <List dense>
            {results.map(user => (
              <ListItem key={user.id} divider>
                <ListItemText
                  primary={user.name}
                  secondary={user.email}
                />

                <ListItemSecondaryAction>
                  {sharedUserIds.has(user.id) ? (
                    <Typography variant="caption" color="text.secondary">
                      Already added
                    </Typography>
                  ) : (
                    <Stack direction="row" spacing={1}>
                      <Select
                        size="small"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                      >
                        <MenuItem value={UserRole.Editor}>Editor</MenuItem>
                        <MenuItem value={UserRole.Viewer}>Viewer</MenuItem>
                      </Select>

                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleAddCollaborator(user.id, role)}
                      >
                        Add
                      </Button>
                    </Stack>
                  )}
                </ListItemSecondaryAction>
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
          {collaborators.map(({ user, role }) => (
            <ListItem key={user.id}>
              <ListItemText
                primary={user.name}
                secondary={user.email}
              />
              <Typography variant="body2" color="text.secondary">
                {role}
              </Typography>
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  )
}

export default ShareDocumentModal
