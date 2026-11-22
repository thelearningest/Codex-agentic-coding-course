import { BrowserWindow, dialog, screen, session } from 'electron'

let popup: BrowserWindow | null = null

function isWebLink(url: string): boolean {
  return URL.parse(url)?.protocol === 'https:'
}

function createPopup(owner: BrowserWindow): BrowserWindow {
  const bounds = owner.getBounds()
  const area = screen.getDisplayMatching(bounds).workArea
  const width = Math.min(1000, area.width)
  const height = Math.min(720, area.height)
  const viewer = new BrowserWindow({
    parent: owner,
    width,
    height,
    x: Math.max(area.x, Math.min(area.x + area.width - width, bounds.x + Math.round((bounds.width - width) / 2))),
    y: Math.max(area.y, Math.min(area.y + area.height - height, bounds.y + Math.round((bounds.height - height) / 2))),
    show: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    webPreferences: {
      partition: 'course-web-links',
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      disableDialogs: true
    }
  })

  const contents = viewer.webContents
  contents.setWindowOpenHandler(({ url }) => {
    if (isWebLink(url)) loadLink(viewer, url)
    return { action: 'deny' }
  })
  contents.on('will-navigate', (event) => {
    if (!isWebLink(event.url)) event.preventDefault()
  })
  contents.on('will-redirect', (event) => {
    if (event.isMainFrame && !isWebLink(event.url)) event.preventDefault()
  })
  viewer.on('page-title-updated', (event) => event.preventDefault())
  contents.on('did-navigate', (_event, url) => {
    if (isWebLink(url)) viewer.setTitle(new URL(url).host)
  })
  contents.on('did-fail-load', (_event, code, _description, url, mainFrame) => {
    if (mainFrame && code !== -3 && isWebLink(url)) {
      void dialog.showMessageBox(viewer, { type: 'warning', message: `Không thể mở ${new URL(url).host}.` })
    }
  })
  contents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape') {
      event.preventDefault()
      // Consume the key release here too so Escape cannot dismiss the owner's panel.
      if (input.type === 'keyUp') viewer.close()
    }
  })
  contents.on('will-prevent-unload', (event) => event.preventDefault())
  const dismiss = () => viewer.destroy()
  owner.once('hide', dismiss)
  viewer.once('closed', () => {
    owner.removeListener('hide', dismiss)
    if (popup === viewer) popup = null
  })
  return viewer
}

function loadLink(viewer: BrowserWindow, url: string): void {
  viewer.setTitle(new URL(url).host)
  // did-fail-load reports navigation failures. Superseded requests can also reject.
  void viewer.loadURL(url).catch(() => {})
}

export function configureWebLinkSession(): void {
  const browsing = session.fromPartition('course-web-links')
  browsing.setPermissionCheckHandler(() => false)
  browsing.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
  browsing.on('will-download', (event) => event.preventDefault())
}

export function routeWebLinks(owner: BrowserWindow): void {
  const openLink = (url: string) => {
    if (!isWebLink(url)) return
    if (popup && popup.getParentWindow() !== owner) popup.destroy()
    popup ??= createPopup(owner)
    loadLink(popup, url)
    popup.show()
  }
  owner.webContents.setWindowOpenHandler(({ url }) => {
    openLink(url)
    return { action: 'deny' }
  })
  owner.webContents.on('will-navigate', (event) => {
    // Keep a same-document reload in the course, including the dev renderer.
    if (event.url === owner.webContents.getURL()) return
    event.preventDefault()
    openLink(event.url)
  })
}
