import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
export interface CursorPosition {
    line: number;
    column: number;
    userName: string;
}
interface User {
    id: number;
    name: string;
    color?: string;
}
export declare class CollaborationProvider {
    private doc;
    provider: WebsocketProvider;
    text: Y.Text;
    private reconnectTimeout;
    private maxReconnectAttempts;
    private reconnectAttempts;
    private user;
    constructor(documentId: string, user: User);
    private handleDisconnection;
    getText(): Y.Text;
    getContent(): string;
    getAwareness(): any;
    sendCursorUpdate(cursor: CursorPosition): void;
    private getUserColor;
    destroy(): void;
}
export {};
