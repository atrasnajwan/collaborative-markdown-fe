import { IconButton, Menu, MenuItem } from '@mui/material'
import { red } from '@mui/material/colors'
import { Document } from '../services/api'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'

type DocumentCardProps = {
  doc: Document
  onClick: (id: number) => void
  onClickMenu: (e: any, doc: Document) => void
  onClickShare: (e: any) => void
  onClickDelete: (e: any) => void
  isMenuOpen: boolean
  onCloseMenu: (e: any) => void
  anchorEl: any
}
const DocumentCard: React.FC<DocumentCardProps> = ({
  doc,
  onClick,
  onClickMenu,
  onClickShare,
  onClickDelete,
  isMenuOpen,
  onCloseMenu,
  anchorEl,
}) => (
  <div
    key={doc.id}
    className="relative bg-card-bg p-6 rounded-lg shadow-lg border border-accent-primary/10 hover:border-accent-primary/30 transition-all duration-200 cursor-pointer"
    onClick={() => onClick(doc.id)}
  >
    <div className="absolute top-4 right-2">
      <IconButton
        onClick={(e) => onClickMenu(e, doc)}
        size="small"
        sx={{ color: 'var(--text-secondary)' }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={onCloseMenu}
        onClick={(e) => e.stopPropagation()} // Stop menu clicks from bubbling
      >
        <MenuItem onClick={onClickShare}>
          <PersonAddAltIcon fontSize="small" sx={{ mr: 1 }} /> Share
        </MenuItem>
        <MenuItem onClick={onClickDelete} sx={{ color: red[500] }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </div>
    <h2 className="text-xl font-semibold text-text-primary mb-2">
      {doc.title}
    </h2>
    <p className="text-text-secondary mb-4 line-clamp-2">{}</p>
    <div className="flex justify-between text-sm text-text-secondary">
      <span>Created: {new Date(doc.created_at).toLocaleDateString()}</span>
      <span>Updated: {new Date(doc.updated_at).toLocaleDateString()}</span>
    </div>
  </div>
)

export default DocumentCard
