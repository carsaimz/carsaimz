// Preload script for Carsai Mozambique Electron app
// Runs in the renderer process before the web page loads.
// Exposes a minimal API via contextBridge if needed.

const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  isElectron: true,
});
