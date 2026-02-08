import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { config } from '../config/env';

export interface CursorPosition {
  line: number;
  column: number;
  userName: string
}

interface User {
  id: number;
  name: string;
  color?: string
}

interface WebsocketProviderOptions {
  connect: boolean;
  params: {
    token: string;
    // userName: string;
  };
}

const MAX_RECONNECT = 3
const RECONNECT_DELAY = 1000

export class CollaborationProvider {
  private doc: Y.Doc;
  public provider: WebsocketProvider;
  public text: Y.Text;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private maxReconnectAttempts = MAX_RECONNECT;
  private reconnectAttempts = 0;
  private user: User
  public synced: boolean

  constructor(documentId: string, user: User, onServerMessage: (e: any) => void ) {
    console.log("Provider Created")
    this.doc = new Y.Doc();
    this.user = user
    const roomName = `doc-${documentId}`
    const token = localStorage.getItem('auth_token');
    const wsUrl = `${config.websocketUrl}`;
    this.synced = false

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const providerOptions: WebsocketProviderOptions = {
      connect: false,
      params: {
        token,
        // userName: user.name,
      },
    };

    this.provider = new WebsocketProvider(
      wsUrl,
      roomName,
      this.doc,
      providerOptions
    );
    // "content" is only identifier
    this.text = this.doc.getText('content');

    this.provider.on('status', ({ status }: { status: 'connected' | 'disconnected' | 'connecting' }) => {
      console.log('WebSocket status:', status);
      if (status === 'connected') {
        this.reconnectAttempts = 0;
        this.customMessageListener(onServerMessage)

        // if (this.provider.synced) {
        //   this.synced = true;
        //   console.log("Reconnected and already synced.");
        // }
        // Wait a tiny bit for the handshake
        setTimeout(() => {
          this.synced = this.provider.synced;
          console.log("[YJS] Status connected, synced property is:", this.synced);
        }, 100);
      } else {
        this.synced = false
      }
    });

    this.provider.on('connection-error', (event: Event) => {
      console.error('WebSocket connection error:', event);
      this.handleDisconnection();
    });
    
    this.provider.on("sync", (state) => {
      this.synced = state;
      console.log("SYNC:", state)
    });    

    this.provider.connect()
  }

  private customMessageListener(onServerMessage: (e: any) => void) {
    this.provider.ws?.addEventListener("message", event => {
      if (typeof event.data !== "string") return;

      try {
        const msg = JSON.parse(event.data);
        onServerMessage(msg);
      } catch (err) {
        console.log(err)
      }
    });
  }

  private handleDisconnection() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect in ${RECONNECT_DELAY}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.provider.connect()
      }, RECONNECT_DELAY);
    }
  }

  public getText(): Y.Text {
    return this.text;
  }

  public getContent(): string {
    return this.text.toString();
  }

  public getAwareness(): any {
    return this.provider.awareness
  }
  

  sendCursorUpdate(cursor: CursorPosition) {
    // Assign a color based on user id (simple hash or pick from array)
    const userColor = this.getUserColor();
    this.provider.awareness.setLocalState({
      cursor,
      user: {
        id: this.user.id,
        name: this.user.name,
        color: userColor,
      },
    });
  }

  private getUserColor(): string {
    const colors = ['#ff4081', '#448aff', '#ffd600', '#00e676', '#ff1744', '#651fff'];
    const idx = Math.abs(this.user.id) % colors.length
    return colors[idx];
  }

  public destroy() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.provider.shouldConnect = false; // tells the library to STOP RETRYING
    if (this.provider.wsconnected) {
      this.provider.disconnect();
    }
    
    this.provider.destroy();
    this.doc.destroy();
  }
}
