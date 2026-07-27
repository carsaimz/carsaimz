const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const SERVER_PORT = 3000;
const SERVER_HOST = "127.0.0.1";
const SERVER_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;
const APP_TITLE = "Carsai Mozambique";
const POLL_INTERVAL_MS = 500;
const POLL_MAX_ATTEMPTS = 60; // 30 seconds max

// ---------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------
let mainWindow = null;
let serverProcess = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the path to the Next.js standalone server.js.
 *
 * When packaged by electron-builder:
 *   - extraResources are placed in process.resourcesPath (outside the asar)
 *   - The standalone server must be outside the asar because Node.js spawn()
 *     cannot execute files inside an asar archive directly.
 *   - extraResources copies .next/standalone to resources/.next/standalone/
 *
 * In dev mode, the standalone output is at the project root.
 */
function getServerPath() {
  if (app.isPackaged) {
    // extraResources places .next/standalone outside the asar at:
    // process.resourcesPath/.next/standalone/server.js
    return path.join(process.resourcesPath, ".next", "standalone", "server.js");
  }
  // Dev: standalone output at project root
  return path.join(process.cwd(), ".next", "standalone", "server.js");
}

/**
 * Poll the server until it responds with a 2xx / 3xx status or the
 * maximum number of attempts is exhausted.
 */
function waitForServer(url, attempts = POLL_MAX_ATTEMPTS) {
  return new Promise((resolve, reject) => {
    let remaining = attempts;

    function poll() {
      http
        .get(url, (res) => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve();
          } else {
            // Server responded but not ready yet – retry
            retry();
          }
          res.resume(); // drain response to free memory
        })
        .on("error", () => {
          retry();
        });
    }

    function retry() {
      remaining -= 1;
      if (remaining <= 0) {
        reject(new Error(`Server at ${url} did not become ready in time`));
      } else {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();
  });
}

/**
 * Start the Next.js standalone server as a child process.
 */
function startServer() {
  const serverPath = getServerPath();

  const env = Object.assign({}, process.env, {
    PORT: String(SERVER_PORT),
    HOSTNAME: SERVER_HOST,
    NODE_ENV: "production",
  });

  // Determine the cwd for the server process.
  // When packaged, the standalone directory is at process.resourcesPath/.next/standalone
  // and needs all sibling directories (.next/static, public) to be accessible.
  const serverCwd = app.isPackaged
    ? path.join(process.resourcesPath, ".next", "standalone")
    : path.dirname(serverPath);

  serverProcess = spawn(process.execPath, [serverPath], {
    env,
    cwd: serverCwd,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  serverProcess.stdout.on("data", (data) => {
    console.log(`[next-server] ${data.toString().trim()}`);
  });

  serverProcess.stderr.on("data", (data) => {
    console.error(`[next-server] ${data.toString().trim()}`);
  });

  serverProcess.on("error", (err) => {
    console.error("Failed to start Next.js server:", err);
  });

  serverProcess.on("exit", (code, signal) => {
    console.log(`Next.js server exited with code ${code}, signal ${signal}`);
    serverProcess = null;
  });
}

/**
 * Stop the Next.js server child process.
 */
function stopServer() {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (_e) {
      // Process may have already exited
    }
    serverProcess = null;
  }
}

// ---------------------------------------------------------------------------
// Window creation
// ---------------------------------------------------------------------------
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: APP_TITLE,
    autoHideMenuBar: true,
    icon: app.isPackaged
      ? path.join(process.resourcesPath, "public", "logo.png")
      : path.join(app.getAppPath(), "public", "logo.png"),
    webPreferences: {
      // preload.js is inside the asar (part of electron/ dir in build.files)
      // __dirname works correctly inside an asar archive
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadURL(SERVER_URL);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Open external links in the default browser (not in Electron)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require("electron").shell.openExternal(url);
    return { action: "deny" };
  });
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

// Prevent multiple instances of the app
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on("ready", async () => {
    try {
      startServer();
      await waitForServer(SERVER_URL);
      createWindow();
    } catch (err) {
      console.error("Error during app startup:", err);
      stopServer();
      app.quit();
    }
  });

  app.on("window-all-closed", () => {
    stopServer();
    app.quit();
  });

  app.on("before-quit", () => {
    stopServer();
  });

  app.on("activate", () => {
    // macOS: re-create window when dock icon is clicked and no windows exist
    if (mainWindow === null) {
      createWindow();
    }
  });
}
