import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { config } from '../config/env';

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

interface WebsocketProviderOptions {
  connect: boolean;
  params: {
    token: string;
    userName: string;
  };
}

const MAX_RECONNECT = 3
const RECONNECT_DELAY = 1000

export class CollaborationProvider {
  private doc: Y.Doc;
  private provider: WebsocketProvider;
  private text: Y.Text;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private maxReconnectAttempts = MAX_RECONNECT;
  private reconnectAttempts = 0;

  constructor(documentId: string, user: User) {
    this.doc = new Y.Doc();
    
    const wsUrl = `${config.websocketUrl}/documents/${documentId}`;
    const roomName = "edit"
    const token = localStorage.getItem('auth_token');

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const providerOptions: WebsocketProviderOptions = {
      connect: false,
      params: {
        token,
        userName: user.name,
      },
    };

    this.provider = new WebsocketProvider(
      wsUrl,
      roomName,
      this.doc,
      providerOptions
    );

    this.text = this.doc.getText('content');

    this.provider.on('status', ({ status }: { status: 'connected' | 'disconnected' | 'connecting' }) => {
      console.log('WebSocket status:', status);
      if (status === 'connected') {
        this.reconnectAttempts = 0;
      } else if (status === 'connecting' && this.reconnectAttempts === this.maxReconnectAttempts) {
        this.destroy()
      }
    });

    this.provider.on('connection-error', (event: Event) => {
      console.error('WebSocket connection error:', event);
    });

    // Initial connection
    this.connect();
  }

  private connect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      try {
        console.log("connecting...")
        this.provider.connect();
      } catch (error) {
        console.error('Failed to connect:', error);
        this.handleDisconnection();
      }
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private handleDisconnection() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect in ${RECONNECT_DELAY}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, RECONNECT_DELAY);
    }
  }

  public getText(): Y.Text {
    return this.text;
  }

  public getContent(): string {
    return this.text.toString();
  }

  public destroy() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    if (this.provider.wsconnected) {
      this.provider.disconnect();
    }
    
    this.provider.destroy();
    this.doc.destroy();
  }
}
