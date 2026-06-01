// Preload script — security bridge between Electron and the web page
// Exposes ONLY what's necessary, nothing from Node.js
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronApp', {
  isElectron: true,
  version: process.env.npm_package_version || '1.0.0',
});
