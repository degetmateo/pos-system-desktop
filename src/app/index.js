const { updateElectronApp } = require('update-electron-app');
const { app, BrowserWindow, ipcMain, Menu, globalShortcut } = require('electron');

if (require('electron-squirrel-startup')) app.quit();

const path = require('path');
const Server = require('./server.js');
const getLanIp = require('./helpers/getLanIp.js');
const database = require('./database/database.js');

updateElectronApp();

database.init();

const server = new Server();
server.start();

let win;

function createWindow () {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.loadURL('http://localhost:4000');
}

app.whenReady().then(() => {
    Menu.setApplicationMenu(null);

    ipcMain.handle('ping', async () => {
        return 'pong';
    });

    ipcMain.handle('get-local-ip', async () => {
        return getLanIp() + ":4000";
    });

    createWindow();

    globalShortcut.register('CommandOrControl+Shift+I', () => {
      if (!win) return
      win.webContents.toggleDevTools()
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        };
    });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});