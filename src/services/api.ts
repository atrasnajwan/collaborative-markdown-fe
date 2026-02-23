import { config } from '../config/env'
import { User, Document, Collaborator, UserRole } from '../types/types'

export interface LoginResponse {
  access_token: string
  user: User
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

export class ApiError extends Error {
  status: number
  data: any

  constructor(status: number, data: any) {
    super(data.message || 'An API error occurred')
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired')
    this.name = 'SessionExpiredError'
  }
}

const buildUrl = (endpoint: string, params?: Record<string, any>) => {
  const queryParams = new URLSearchParams()
  if (params) {
    Object.keys(params).forEach(
      (key) =>
        params[key] !== undefined &&
        queryParams.append(key, params[key].toString())
    )
  }
  const queryString = queryParams.toString()
  return `${endpoint}${queryString ? `?${queryString}` : ''}`
}

const NO_AUTH_ENDPOINT = ['/refresh', '/login', '/register']

class ApiService {
  private token: string | null = null
  private isRefreshing: boolean = false
  private refreshPromise: Promise<string> | null = null
  private onSessionExpired: (() => void) | null = null

  setToken(token: string) {
    this.token = token
  }

  setSessionExpiredHandler(handler: (() => void) | null) {
    this.onSessionExpired = handler
  }

  getToken(): string | null {
    return this.token
  }

  clearToken() {
    this.token = null
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry: boolean = true
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.getToken()) {
      headers['Authorization'] = `Bearer ${this.getToken()}`
    }

    const response = await fetch(`${config.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      credentials: 'include', // important for refresh cookie
    })

    if (
      response.status === 401 &&
      retry &&
      !NO_AUTH_ENDPOINT.includes(endpoint)
    ) {
      try {
        const token = await this.refreshToken()
        this.setToken(token)

        // retry original request once
        return this.request<T>(endpoint, options, false)
      } catch (err) {
        this.clearToken()
        throw err
      }
    }

    if (response.status === 204) {
      return {} as T
    }

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch {
        errorData = { message: 'Internal Server Error' }
      }
      throw new ApiError(response.status, errorData)
    }

    return response.json()
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    this.setToken(response.access_token)
    return response
  }

  async refreshToken(): Promise<string> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }
    this.isRefreshing = true
    this.refreshPromise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(`${config.apiUrl}/refresh`, {
          method: 'POST',
          credentials: 'include',
        })

        if (!response.ok) {
          this.clearToken()
          if (response.status === 401) this.onSessionExpired?.()
          reject(new SessionExpiredError())
          return
        }
        const data = await response.json()
        resolve(data.access_token)
      } catch (err) {
        reject(err)
      } finally {
        this.isRefreshing = false
        this.refreshPromise = null
      }
    })
    return this.refreshPromise
  }

  async register(name: string, email: string, password: string): Promise<User> {
    const response = await this.request<User>('/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    return response
  }

  async getDocuments(
    params: GetDocumentsParams = {}
  ): Promise<PaginatedResponse<Document>> {
    const endpoint = buildUrl('/documents', params)

    return this.request<PaginatedResponse<Document>>(endpoint)
  }

  async getSharedDocuments(
    params: GetDocumentsParams = {}
  ): Promise<PaginatedResponse<Document>> {
    const endpoint = buildUrl('/documents/shared', params)

    return this.request<PaginatedResponse<Document>>(endpoint)
  }

  async logout(): Promise<void> {
    await this.request('/logout', {
      method: 'DELETE',
    })
    this.clearToken()
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/profile')
  }

  async updateProfile(name: string, email: string): Promise<User> {
    return this.request<User>('/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name, email }),
    })
  }

  async changePassword(
    current_password: string,
    new_password: string
  ): Promise<void> {
    await this.request<void>('/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ current_password, new_password }),
    })
  }

  async searchUser(query: string): Promise<User[]> {
    return this.request<User[]>(`/users?q=${query}`)
  }

  async createDocument(title: string): Promise<Document> {
    return this.request<Document>('/documents', {
      method: 'POST',
      body: JSON.stringify({ title }),
    })
  }

  async getDocument(id: string | number): Promise<Document> {
    return this.request<Document>(`/documents/${id}`)
  }

  async getDocumentCollaborators(id: string | number): Promise<Collaborator[]> {
    return this.request<Collaborator[]>(`/documents/${id}/collaborators`)
  }

  async addDocumentCollaborator(
    docId: number | string,
    userId: number,
    role: UserRole
  ): Promise<Collaborator> {
    return this.request<Collaborator>(`/documents/${docId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, role }),
    })
  }

  async changeCollaboratorRole(
    docId: number | string,
    userId: number,
    role: UserRole
  ): Promise<Collaborator> {
    return this.request<Collaborator>(`/documents/${docId}/collaborators`, {
      method: 'PUT',
      body: JSON.stringify({ user_id: userId, role }),
    })
  }

  async removeDocumentCollaborator(
    docId: number | string,
    userId: number
  ): Promise<void> {
    return this.request<void>(`/documents/${docId}/collaborators/${userId}`, {
      method: 'DELETE',
    })
  }

  async deleteDocument(docId: number | string): Promise<void> {
    return this.request<void>(`/documents/${docId}`, {
      method: 'DELETE',
    })
  }

  async renameDocument(
    docId: number | string,
    title: string
  ): Promise<Document> {
    return this.request<Document>(`/documents/${docId}/rename`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    })
  }
}

export const api = new ApiService()
