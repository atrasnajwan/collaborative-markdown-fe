export interface User {
  id: number
  name: string
  email: string
}
export interface LoginResponse {
  token: string
  user: User
}
export declare enum UserRole {
  Owner = 'owner',
  Editor = 'editor',
  Viewer = 'viewer',
  None = 'none',
}
export type Collaborator = {
  user: User
  role: 'owner' | 'editor' | 'viewer'
}
export interface Document {
  id: number
  title: string
  created_at: string
  updated_at: string
  role: UserRole
}
export interface PaginationMeta {
  total: number
  current_page: number
  per_page: number
  total_page: number
}
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}
export interface GetDocumentsParams {
  page?: number
  per_page?: number
}
declare class ApiService {
  private token
  constructor()
  setToken(token: string): void
  getToken(): string | null
  clearToken(): void
  private request
  login(email: string, password: string): Promise<LoginResponse>
  register(
    name: string,
    email: string,
    password: string
  ): Promise<LoginResponse>
  getDocuments(
    params?: GetDocumentsParams
  ): Promise<PaginatedResponse<Document>>
  logout(): Promise<void>
  getCurrentUser(): Promise<User>
  searchUser(query: string): Promise<User[]>
  createDocument(title: string): Promise<Document>
  getDocument(id: string | number): Promise<Document>
  getDocumentCollaborators(id: string | number): Promise<Collaborator[]>
  addDocumentCollaborator(
    docId: number | string,
    userId: number,
    role: UserRole
  ): Promise<Collaborator>
  changeCollaboratorRole(
    docId: number | string,
    userId: number,
    role: UserRole
  ): Promise<Collaborator>
  removeDocumentCollaborator(
    docId: number | string,
    userId: number
  ): Promise<void>
}
export declare const api: ApiService
export {}
