import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { User as UserApi } from '../services/api';
export interface CursorPosition {
    line: number;
    column: number;
}
export interface SelectionRange {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}
interface User {
    id: number;
    name: string;
    color: string;
}
export interface AwarenessState {
    cursor?: CursorPosition;
    uiSelection?: SelectionRange;
    user: User;
}
type OnSyncCallback = (state: boolean) => void;
export declare class CollaborationProvider {
    private doc;
    provider: WebsocketProvider;
    text: Y.Text;
    private user;
    synced: boolean;
    onSyncReady: OnSyncCallback;
    constructor(documentId: string, user: UserApi, onMsg: (e: any) => void, onSync: OnSyncCallback);
    private setupListeners;
    private rawMsgHandler;
    destroy(): void;
    getText(): Y.Text;
    getContent(): string;
    getAwareness(): any;
    sendCursorUpdate(cursor: CursorPosition, selection?: SelectionRange): void;
    private getUserColor;
}
export {};
