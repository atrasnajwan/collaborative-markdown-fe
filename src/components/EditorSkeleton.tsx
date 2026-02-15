import React from 'react'
import { Box, Skeleton } from '@mui/material'

const EditorSkeleton: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#1e1e1e',
    }}
  >
    {/* Mimic the AppBar */}
    <Skeleton variant="rectangular" height={64} width="100%" sx={{ mb: 1 }} />

    <Box sx={{ display: 'flex', flexGrow: 1 }}>
      {/* Mimic the Split Panes */}
      <Box sx={{ flexGrow: 1, display: 'flex', p: 1, gap: 2 }}>
        <Skeleton variant="rounded" sx={{ flex: 1, height: '100%' }} />{' '}
        {/* Editor Pane */}
        <Skeleton
          variant="rounded"
          sx={{ flex: 1, height: '100%', display: { xs: 'none', lg: 'block' } }}
        />{' '}
        {/* Preview Pane */}
      </Box>
    </Box>
  </Box>
)
export default EditorSkeleton
