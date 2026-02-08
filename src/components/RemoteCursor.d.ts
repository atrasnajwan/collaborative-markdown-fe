import React from 'react'
import { CursorPosition } from '../services/CollaborationProvider'
interface RemoteCursorProps {
  cursor: CursorPosition
  editorLineHeight: number
  charWidth: number
}
declare const RemoteCursor: React.FC<RemoteCursorProps>
export default RemoteCursor
