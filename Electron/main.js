const { app, BrowserWindow, shell, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;
let splashWindow = null;
let tray = null;
const FRONTEND_URL = `https://federigene.com`;

// ── Create the splash / loading screen ────────────────────────────────────────
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 320,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: { nodeIntegration: false },
    icon: path.join(__dirname, 'assets', 'icon.ico'),
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.center();
}

// ── Create the main app window ────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    title: 'FederiGene',
    autoHideMenuBar: true, // Completely hides the File/Edit/View menu
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    backgroundColor: '#0f172a',
    titleBarStyle: 'default',
  });

  // Open external links in the system browser, not in the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.setMenuBarVisibility(false); // Double enforce no menu bar

  mainWindow.loadURL(`${FRONTEND_URL}/login`);

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.destroy();
    }
    mainWindow.show();
    mainWindow.maximize();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── System Tray Icon ──────────────────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.ico');
  tray = new Tray(nativeImage.createFromPath(iconPath));

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open FederiGene', click: () => { if (mainWindow) { mainWindow.show(); } else { createMainWindow(); } } },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);

  tray.setToolTip('FederiGene Platform');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) { mainWindow.show(); } else { createMainWindow(); }
  });
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // Remove the default Windows menu bar (File, View, Window, Help)
  Menu.setApplicationMenu(null);

  // Show splash immediately
  createSplashWindow();
  createTray();

  // Create main window
  setTimeout(() => {
    createMainWindow();
  }, 1000);
});

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    } else {
      createMainWindow(); // Re-open if the window was previously closed!
    }
  });
}

app.on('will-quit', () => {
  if (tray) tray.destroy();
});

app.on('window-all-closed', () => {
  app.quit(); // Completely quit the app when the X is clicked
});

app.on('activate', () => {
  if (mainWindow === null) createMainWindow();
});
