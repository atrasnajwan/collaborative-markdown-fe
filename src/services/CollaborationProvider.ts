import { Doc as YDoc, Text as YText } from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { config } from '../config/env'
import { api } from '../services/api'
import {
  AwarenessState,
  CursorPosition,
  SelectionRange,
  User,
} from '../types/types'

type OnSyncCallback = (state: boolean) => void
type AwarenessChangeHandler = (states: Map<number, AwarenessState>) => void

export class CollaborationProvider {
  private doc: YDoc
  public provider!: WebsocketProvider
  public text: YText
  private user: User
  public onSyncReady: OnSyncCallback

  private documentId: string
  private onStatus: (isConnected: boolean) => void
  private onMsg: (e: any) => void
  private textObserver: () => void
  private onAwarenessChange: AwarenessChangeHandler
  private textTimeout: any = null

  constructor(
    documentId: string,
    user: User,
    onStatus: (isConnected: boolean) => void,
    onMsg: (e: any) => void,
    onSync: OnSyncCallback,
    onText: (str: string) => void,
    onAwarenessChange: AwarenessChangeHandler
  ) {
    this.doc = new YDoc()
    this.text = this.doc.getText('content')
    this.textObserver = () => {
      // Clear the previous timer if the user is still typing
      if (this.textTimeout) {
        clearTimeout(this.textTimeout)
      }

      this.textTimeout = setTimeout(() => {
        if (this.provider) {
          onText(this.getContent())
        }
        this.textTimeout = null
      }, 300)
    }

    this.user = user
    this.documentId = documentId
    this.onStatus = onStatus
    this.onMsg = onMsg
    this.onSyncReady = onSync
    this.onAwarenessChange = onAwarenessChange
    this.text.observe(this.textObserver)
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
    this.provider.awareness.on('change', () => {
      const states = this.provider!.awareness.getStates() as Map<
        number,
        AwarenessState
      >

      this.onAwarenessChange(states)
    })

    this.provider.connect()
  }

  private recreateProvider() {
    this.provider.awareness.destroy()
    this.provider.destroy()
    this.createProvider()
  }

  private setupListeners() {
    this.provider.on('status', ({ status }: any) => {
      console.log('WS status:', status, new Date().toLocaleString())

      if (status === 'connected') {
        this.onStatus(true)
        this.onSyncReady(false)
      } else {
        this.onStatus(false)
        this.onSyncReady(false)
      }
    })

    this.provider.on('sync', (isSynced: boolean) => {
      console.log('sync:', isSynced)

      this.onSyncReady(isSynced)

      if (isSynced) {
        // set user metadata
        this.provider.awareness.setLocalStateField('user', {
          id: this.user.id,
          name: this.user.name,
          color: this.getUserColor(), // Assign a color based on user id (simple hash or pick from array)
        })
      }
    })

    this.provider.on('message', (event: any) => {
      this.rawMsgHandler(event, this.onMsg)
    })

    this.provider.on('connection-close', async (event: CloseEvent) => {
      if (event.code === 4001) {
        console.log('Disconnected with status code: ' + event.code)
        try {
          const token = await api.refreshToken()
          api.setToken(token)
          console.log('Recreate provider cause session expired')
          this.recreateProvider()
        } catch (err) {
          console.error(err)
        }
      }
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

  public destroy() {
    this.provider.shouldConnect = false
    this.text.unobserve(this.textObserver)
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
