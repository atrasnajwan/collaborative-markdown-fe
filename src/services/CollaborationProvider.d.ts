import * as Y from 'yjs';
export interface CursorPosition {
    userId: string;
    userName: string;
    line: number;
    column: number;
}
interface User {
    id: string;
    name: string;
}
export declare class CollaborationProvider {
    private doc;
    private provider;
    private text;
    private reconnectTimeout;
    private maxReconnectAttempts;
    private reconnectAttempts;
    constructor(documentId: string, user: User);
    private connect;
    private handleDisconnection;
    getText(): Y.Text;
    getContent(): string;
    destroy(): void;
}
export {};
