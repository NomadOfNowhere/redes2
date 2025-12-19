const { app, BrowserWindow, ipcMain, protocol, net, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');
const { log } = require('console');
const fs = require('fs');

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
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
    console.log("Modo Desarrollo: Cargando localhost:5173");
  } else {
    // En producción cargamos el archivo
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    console.log("Modo Producción: Cargando archivo local");
  }
}

// --- GESTIÓN DE JAVA (PATRÓN SIDECAR) ---
// 1. Iniciar Client (Receptor)
ipcMain.on('start-java-client', (event, { name }) => {
  console.log(`Iniciando cliente Java como ${name}...`);
  runJava('Client.jar', [name]);
});

// 2. Detener Java
ipcMain.on('stop-java', () => killJava());

const CMD_MAP = {
  'CMD:ROOMS:': 'rooms-updated',
  'CMD:MYROOMS:': 'myrooms-updated',
  'CMD:USERS:': 'users-updated',
  'CMD:CONNECTED:': 'connection-success',
  'CMD:STATUS:': 'connection-status',
  'CMD:MSG:': 'message-received',
};

function tryParseAndSend(jsonString, channel) {
  try {
    const data = JSON.parse(jsonString);
    // console.log(`[Data ${channel}]:`, data);
    console.log("xd: " + data);
    if (mainWindow) mainWindow.webContents.send(channel, data);
    return true;
  } catch (e) {
    console.error(`Error procesando ${jsonString}:`, e);
    return false;
  }
}

function runJava(jarName, args) {
  killJava(); // Matar proceso anterior si existe

  const jarPath = getJarPath(jarName);
  console.log(`Iniciando Java: ${jarPath} con args: ${args}`);
  javaProcess = spawn('java', ['-jar', jarPath, ...args]);

  // Escuchar STDOUT de Java y enviarlo a React
  javaProcess.stdout.on('data', (data) => {
    const chunk = data.toString();
    const lines = chunk.split('\n');

    lines.forEach(line => {
      const msg = line.trim();
      if (!msg || msg.startsWith("Iniciando")) return;
      console.log(`[Java]: ${msg}`);
      if (mainWindow) mainWindow.webContents.send('java-log', msg);

      // Comandos JSON
      let idx = msg.indexOf("[");
      if (idx === -1) {
        idx = msg.indexOf("{");
      }

      // encontramos JSON válido...
      if (idx !== -1) {
        const cmd = msg.slice(0, idx).trim();
        const jsonString = msg.slice(idx);
        const channel = CMD_MAP[cmd];
        console.log("Xddd");
        console.log(cmd);
        console.log(msg);
        if (channel) {
          tryParseAndSend(jsonString, channel);
        } else {
          console.log(`[ERROR] Comando no mapeado: '${cmd}'`);
        }
      }
    });

    // if (msg.includes('STATUS:FILE_READY:')) {
    //   const parts = msg.split('STATUS:FILE_READY:');
    //   if (parts.length > 1) {
    //     let path = parts[1];

    //     if (path.includes('\n')) {
    //         path = path.split('\n')[0];
    //     }
    //     if (path.includes('\r')) {
    //         path = path.split('\r')[0];
    //     }
    //     const finalPath = path.trim();
    //     if (mainWindow) {
    //       mainWindow.webContents.send('song-received', finalPath);
    //     }
    //   }
    // }
  });

  ipcMain.removeAllListeners('send-to-java');

  // 4. Enviar comandos a Java (Escribir en STDIN)
  ipcMain.on('send-to-java', (event, input) => {
    if (javaProcess && javaProcess.stdin) {
      try {
        console.log(`[Enviando a Java]: ${input}`);
        // IMPORTANTE: Agregar '\n' simula presionar la tecla ENTER.
        // Sin esto, Java se quedará esperando y no procesará la línea.
        javaProcess.stdin.write(input + '\n');
      } catch (e) {
        console.error("Error escribiendo en stdin de Java:", e);
      }
    } else {
      console.warn("Intentando enviar comando pero el proceso Java no está activo.");
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
  ipcMain.removeAllListeners('send-to-java');
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