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

class ApiService {
  private token: string | null = null
  private isRefreshing: boolean = false
  private refreshPromise: Promise<string> | null = null

  setToken(token: string) {
    this.token = token
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

    if (response.status === 401 && retry && endpoint !== '/refresh') {
      try {
        const token = await this.refreshToken()
        this.setToken(token)

        // retry original request once
        return this.request<T>(endpoint, options, false)
      } catch (err) {
        this.clearToken()
        // window.location.href = '/'
        // throw err
      }
    }

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'An error occurred')
    }

    if (response.status === 204) {
      return {} as T
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
          throw new Error('Refresh failed')
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
    const queryParams = new URLSearchParams()

    if (params.page) {
      queryParams.append('page', params.page.toString())
    }

    if (params.per_page) {
      queryParams.append('per_page', params.per_page.toString())
    }

    const queryString = queryParams.toString()
    const endpoint = `/documents${queryString ? `?${queryString}` : ''}`

    return this.request<PaginatedResponse<Document>>(endpoint)
  }

  async getSharedDocuments(
    params: GetDocumentsParams = {}
  ): Promise<PaginatedResponse<Document>> {
    const queryParams = new URLSearchParams()

    if (params.page) {
      queryParams.append('page', params.page.toString())
    }

    if (params.per_page) {
      queryParams.append('per_page', params.per_page.toString())
    }

    const queryString = queryParams.toString()
    const endpoint = `/documents/shared${queryString ? `?${queryString}` : ''}`

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
}

export const api = new ApiService()
