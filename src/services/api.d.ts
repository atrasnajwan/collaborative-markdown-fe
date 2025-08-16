export interface User {
    id: string;
    name: string;
    email: string;
}
export interface LoginResponse {
    token: string;
    user: User;
}
export interface Document {
    id: number;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
    user_id: number;
}
export interface PaginationMeta {
    total: number;
    current_page: number;
    per_page: number;
    total_page: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}
export interface GetDocumentsParams {
    page?: number;
    per_page?: number;
}
declare class ApiService {
    private token;
    setToken(token: string): void;
    getToken(): string | null;
    clearToken(): void;
    private request;
    login(email: string, password: string): Promise<LoginResponse>;
    register(name: string, email: string, password: string): Promise<LoginResponse>;
    getDocuments(params?: GetDocumentsParams): Promise<PaginatedResponse<Document>>;
    logout(): Promise<void>;
    getCurrentUser(): Promise<User>;
    createDocument(title: string): Promise<Document>;
    getDocument(id: string | number): Promise<Document>;
}
export declare const api: ApiService;
export {};
