export interface User {
  id: number
  name: string
  email: string
}

export enum UserRole {
  Owner = 'owner',
  Editor = 'editor',
  Viewer = 'viewer',
  None = 'none',
}

export interface Collaborator {
  user: User
  role: UserRole
}

export interface Document {
  id: number
  title: string
  created_at: string
  updated_at: string
  role: UserRole
  owner_name: string
  owner_id: number
}

export interface CursorPosition {
  line: number
  column: number
}

export interface SelectionRange {
  startLine: number
  startColumn: number
  endLine: number
  endColumn: number
}

export interface UserAwareness {
  id: number
  name: string
  color: string
}

export interface AwarenessState {
  cursor?: CursorPosition // Nullable in case of blur
  uiSelection?: SelectionRange // Nullable in case of no selection
  user: UserAwareness
}
