import { Doc as YDoc, Text as YText } from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { config } from '../config/env'
import { api, User } from '../services/api'

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

type OnSyncCallback = (state: boolean) => void

export class CollaborationProvider {
  private doc: YDoc
  public provider: WebsocketProvider
  public text: YText
  private user: User
  public synced: boolean = false
  public onSyncReady: OnSyncCallback

  constructor(
    documentId: string,
    user: User,
    onMsg: (e: any) => void,
    onSync: OnSyncCallback
  ) {
    this.doc = new YDoc()
    this.user = user
    this.onSyncReady = onSync

    const token = api.getToken()
    this.provider = new WebsocketProvider(
      config.websocketUrl,
      `doc-${documentId}`,
      this.doc,
      { connect: false, params: { token: token || '' } }
    )
    this.text = this.doc.getText('content')

    this.setupListeners(onMsg)
    this.provider.connect()

    // set user metadata
    this.provider.awareness.setLocalStateField('user', {
      id: this.user.id,
      name: this.user.name,
      color: this.getUserColor(), // Assign a color based on user id (simple hash or pick from array)
    })
  }

  private setupListeners(onMsg: (e: any) => void) {
    this.provider.on('status', ({ status }: any) => {
      console.log('WS status:', status)

      if (status === 'connected') {
        this.provider.ws?.addEventListener('message', (e) =>
          this.rawMsgHandler(e, onMsg)
        )
        this.synced = true
        this.onSyncReady(true)
      } else {
        this.synced = false
        this.onSyncReady(false)
      }
    })

    this.provider.on('sync', (isSynced: boolean) => {
      console.log('sync:', isSynced)

      this.synced = isSynced
      this.onSyncReady(isSynced)
    })
  }

  private rawMsgHandler(event: any, callback: (msg: any) => void) {
    if (typeof event.data !== 'string') return
    try {
      callback(JSON.parse(event.data))
    } catch (e) {
      /* ignore binary Yjs packets */
    }
  }

  public destroy() {
    this.provider.shouldConnect = false
    if (this.provider.ws) {
      this.provider.ws.close()
    }
    this.provider.awareness.destroy()
    this.provider.destroy()
    this.doc.destroy()
  }

  public getText(): YText {
    return this.text
  }

  public getContent(): string {
    return this.text.toString()
  }

  public getAwareness(): any {
    return this.provider.awareness
  }

  public sendCursorUpdate(cursor: CursorPosition, selection?: SelectionRange) {
    // only send moving parts
    this.provider.awareness.setLocalStateField('cursor', cursor)
    this.provider.awareness.setLocalStateField('uiSelection', selection)
  }

  private getUserColor(): string {
    const colors = ['#ff4081', '#ffd600', '#00e676', '#ff1744', '#651fff']
    const idx = Math.abs(this.user.id) % colors.length
    return colors[idx]
  }
}
