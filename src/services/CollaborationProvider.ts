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
  public provider!: WebsocketProvider
  public text: YText
  private user: User
  public synced: boolean = false
  public onSyncReady: OnSyncCallback

  private documentId: string
  private onMsg: (e: any) => void

  private hasEverSynced = false
  private reconnectAttempts = 0
  private syncWatchdog: any = null

  private readonly MAX_RECONNECT_ATTEMPTS = 5
  private readonly BASE_DELAY = 1000 // 1s

  constructor(
    documentId: string,
    user: User,
    onMsg: (e: any) => void,
    onSync: OnSyncCallback
  ) {
    this.doc = new YDoc()
    this.text = this.doc.getText('content')

    this.user = user
    this.documentId = documentId
    this.onMsg = onMsg
    this.onSyncReady = onSync

    this.createProvider()
  }

  private createProvider() {
    const token = api.getToken()

    this.provider = new WebsocketProvider(
      config.websocketUrl,
      `doc-${this.documentId}`,
      this.doc,
      { connect: false, params: { token: token || '' } }
    )

    this.setupListeners()

    this.provider.connect()

    // set user metadata
    this.provider.awareness.setLocalStateField('user', {
      id: this.user.id,
      name: this.user.name,
      color: this.getUserColor(), // Assign a color based on user id (simple hash or pick from array)
    })
  }

  private recreateProvider() {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnect attempts reached.')
      return
    }

    this.reconnectAttempts++

    const delay =
      this.BASE_DELAY * Math.pow(2, this.reconnectAttempts - 1) +
      Math.random() * 300 // jitter

    console.warn(
      `Recreating provider in ${delay}ms (attempt ${this.reconnectAttempts})`
    )

    setTimeout(() => {
      this.provider.destroy()
      this.createProvider()
    }, delay)
  }

  private setupListeners() {
    this.provider.on('status', ({ status }: any) => {
      console.log('WS status:', status)

      if (status === 'connected') {
        this.synced = false
        this.onSyncReady(false)

        this.startSyncWatchdog()
      } else {
        this.synced = false
        this.onSyncReady(false)
        this.clearWatchdog()
      }
    })

    this.provider.on('sync', (isSynced: boolean) => {
      console.log('sync:', isSynced)

      this.synced = isSynced
      this.onSyncReady(isSynced)

      if (isSynced) {
        this.hasEverSynced = true
        this.reconnectAttempts = 0
        this.clearWatchdog()
      }
    })

    this.provider.on('message', (event: any) => {
      this.rawMsgHandler(event, this.onMsg)
    })
  }

  private rawMsgHandler(event: any, callback: (msg: any) => void) {
    if (typeof event.data !== 'string') return
    try {
      callback(JSON.parse(event.data))
    } catch {
      // ignore binary Yjs packets
    }
  }

  private startSyncWatchdog() {
    this.clearWatchdog()

    const timeout = this.BASE_DELAY * Math.pow(2, this.reconnectAttempts)

    this.syncWatchdog = setTimeout(() => {
      if (!this.hasEverSynced) {
        console.warn('Sync timeout. Forcing provider recreation.')
        this.recreateProvider()
      } else {
        this.synced = true
        this.onSyncReady(true)
      }
    }, timeout)
  }

  private clearWatchdog() {
    if (this.syncWatchdog) {
      clearTimeout(this.syncWatchdog)
      this.syncWatchdog = null
    }
  }
  public destroy() {
    this.clearWatchdog()
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
