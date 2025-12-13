const { app, BrowserWindow, ipcMain, protocol, net } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

let mainWindow;
let javaProcess;

// Función para obtener la ruta correcta del JAR (Desarrollo vs Producción)
const getJarPath = (jarName) => {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'binaries', jarName)
    : path.join(__dirname, '../resources/binaries', jarName);
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5174');
    mainWindow.webContents.openDevTools();
    console.log("Modo Desarrollo: Cargando localhost:5174");
  } else {
    // En producción cargamos el archivo
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    console.log("Modo Producción: Cargando archivo local");
  }
}

// --- GESTIÓN DE JAVA (PATRÓN SIDECAR) ---
// 2. Iniciar Client (Receptor)
ipcMain.on('start-java-client', (event) => {
  console.log("Iniciando cliente Java...");
  runJava('client.jar', []);
});

// 3. Detener Java
ipcMain.on('stop-java', () => killJava());

function runJava(jarName, args) {
  killJava(); // Matar proceso anterior si existe
  
  const jarPath = getJarPath(jarName);
  console.log(`Iniciando Java: ${jarPath} con args: ${args}`);

  javaProcess = spawn('java', ['-jar', jarPath, ...args]);

  // Escuchar STDOUT de Java y enviarlo a React
  javaProcess.stdout.on('data', (data) => {
    const msg = data.toString().trim();
    console.log(`[Java]: ${msg}`);
    if (mainWindow) mainWindow.webContents.send('java-log', msg);

    if (msg.includes('STATUS:FILE_READY:')) {
      const parts = msg.split('STATUS:FILE_READY:');
      if (parts.length > 1) {
        let path = parts[1];

        if (path.includes('\n')) {
            path = path.split('\n')[0];
        }
        if (path.includes('\r')) {
            path = path.split('\r')[0];
        }
        const finalPath = path.trim();
        if (mainWindow) {
          mainWindow.webContents.send('song-received', finalPath);
        }
      }
    }
  });

  javaProcess.on('close', (code) => {
    console.log(`El proceso Java se cerró con código: ${code}`);
    
    // Le avisamos a React que el proceso ya no existe
    if (mainWindow) {
      mainWindow.webContents.send('java-process-closed', code);
    }
    
    javaProcess = null;
  });

  javaProcess.stderr.on('data', (data) => {
    console.error(`JAVA ERR: ${data}`);
  });
}

function killJava() {
  if (javaProcess) {
    javaProcess.kill();
    javaProcess = null;
  }
}

// --- CICLO DE VIDA DE ELECTRON ---
protocol.registerSchemesAsPrivileged([
  { scheme: 'media', privileges: { bypassCSP: true, stream: true, supportFetchAPI: true, secure: true } }
]);

app.whenReady().then(() => {
  protocol.handle('media', (request) => {
    let filePath = request.url.slice('media://'.length);
    filePath = decodeURIComponent(filePath);
    return net.fetch(pathToFileURL(filePath).toString());
  });
  createWindow();
});

app.on('window-all-closed', () => {
  killJava(); // Importante: No dejar Java corriendo huérfano
  if (process.platform !== 'darwin') app.quit();
});