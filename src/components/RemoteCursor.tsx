import React from 'react'
import { CursorPosition } from '../services/CollaborationProvider'

interface RemoteCursorProps {
  cursor: CursorPosition
  editorLineHeight: number
  charWidth: number
}

const RemoteCursor: React.FC<RemoteCursorProps> = ({
  cursor,
  editorLineHeight,
  charWidth,
}) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: cursor.column * charWidth,
    top: cursor.line * editorLineHeight,
    width: '2px',
    height: editorLineHeight,
    backgroundColor: '#ff0000',
    pointerEvents: 'none',
  }

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    left: '4px',
    top: '-18px',
    backgroundColor: '#ff0000',
    color: 'white',
    padding: '2px 4px',
    borderRadius: '3px',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  }

  return (
    <div style={style}>
      <div style={labelStyle}>{cursor.userName}</div>
    </div>
  )
}

export default RemoteCursor
