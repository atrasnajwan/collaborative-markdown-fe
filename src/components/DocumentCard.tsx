import React from 'react'
import {
  Card,
  CardContent,
  CardActionArea,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Chip,
  Stack,
} from '@mui/material'
import { red } from '@mui/material/colors'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import { User, UserRole, Document } from '../types/types'

type DocumentCardProps = {
  doc: Document
  user: User | null
  onClick: (id: number) => void
  onClickMenu: (e: React.MouseEvent<HTMLElement>, doc: Document) => void
  onClickShare: (e: React.MouseEvent<HTMLElement>) => void
  onClickDelete: (e: React.MouseEvent<HTMLElement>) => void
  onClickRename: (e: React.MouseEvent<HTMLElement>) => void
  isMenuOpen: boolean
  onCloseMenu: () => void
  anchorEl: HTMLElement | null
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  doc,
  user,
  onClick,
  onClickMenu,
  onClickRename,
  onClickShare,
  onClickDelete,
  isMenuOpen,
  onCloseMenu,
  anchorEl,
}) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case UserRole.Owner:
        return 'primary'
      case UserRole.Editor:
        return 'success'
      case UserRole.Viewer:
        return 'info'
      default:
        return 'default'
    }
  }

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-4px)',
        },
      }}
    >
      <CardActionArea onClick={() => onClick(doc.id)} sx={{ flexGrow: 1 }}>
        <CardContent>
          <Typography
            variant="h6"
            component="h2"
            sx={{
              fontWeight: 600,
              lineHeight: 1.2,
              mb: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {doc.title}
          </Typography>

          {doc.role && (
            <Box sx={{ mb: 2 }}>
              <Chip
                label={doc.role}
                size="small"
                color={getRoleColor(doc.role)}
                variant={doc.role === UserRole.Owner ? 'filled' : 'outlined'}
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              />
            </Box>
          )}

          <Stack spacing={0.5}>
            {doc.owner_name && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 500, color: 'text.primary' }}
                >
                  Owner:
                </Typography>
                {user?.id && (
                  <Typography variant="caption" color="text.secondary">
                    {doc.owner_id === user.id ? 'Me' : doc.owner_name}
                  </Typography>
                )}
              </Box>
            )}

            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}
            >
              <Typography variant="caption" color="text.disabled">
                Created {new Date(doc.created_at).toLocaleDateString()}
              </Typography>
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ fontStyle: 'italic' }}
              >
                Updated {new Date(doc.updated_at).toLocaleDateString()}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>

      {doc.role === UserRole.Owner && (
        <>
          <IconButton
            size="small"
            onClick={(e) => onClickMenu(e, doc)}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <MoreVertIcon />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={isMenuOpen}
            onClose={onCloseMenu}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={onClickRename}>
              <EditIcon sx={{ mr: 1 }} />
              Rename
            </MenuItem>
            <MenuItem onClick={onClickShare}>
              <PersonAddAltIcon sx={{ mr: 1 }} />
              Share
            </MenuItem>
            {doc.role === UserRole.Owner && (
              <MenuItem onClick={onClickDelete} sx={{ color: red[500] }}>
                <DeleteIcon sx={{ mr: 1 }} />
                Delete
              </MenuItem>
            )}
          </Menu>
        </>
      )}
    </Card>
  )
}

export default DocumentCard
