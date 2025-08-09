const express = require('express');
const path = require('path');
const livereload = require('livereload');
const connectLivereload = require('connect-livereload');
const { spawn } = require('child_process');
const chokidar = require('chokidar');
const fs = require('fs');
const xlsx = require('xlsx');
const os = require('os');

const app = express();
app.use(express.json());

app.use(connectLivereload());

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

function getExeParentPath() {
  if (process.pkg) {
    // Если приложение запущено как собранный exe
    return path.dirname(process.execPath);
  } else {
    // Если запускается в режиме разработки
    return path.resolve(__dirname, '..');
  }
}


const dataDir = getExeParentPath()

app.get('/files', (req, res) => {
  fs.readdir(dataDir, (err, files) => {
    if (err) {
      console.error("Folder reading error:", err);
      return res.status(500).json({ error: 'Folder reading error' });
    }
    res.json({ files });
  });
});

app.get('/xlsx-sheets', (req, res) => {
  const fileName = req.query.file;

  if (!fileName || !fileName.endsWith('.xlsx')) {
    return res.status(400).json({ error: 'Invalied Excel-file extension' });
  }

  const filePath = path.join(dataDir, fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Missing file' });
  }

  try {
    const workbook = xlsx.readFile(filePath);
    const sheets = workbook.SheetNames;

    res.json({ sheets });
  } catch (err) {
    console.error('Error occured when file reading:', err);
    res.status(500).json({ error: 'Reading Excel-file error' });
  }
});

function copyAssetToTmp(assetRelPath) {
  const tmpDir = os.tmpdir();
  const fileName = path.basename(assetRelPath);
  const tmpFilePath = path.join(tmpDir, fileName);

  const fileBuffer = fs.readFileSync(path.join(__dirname, assetRelPath));
  fs.writeFileSync(tmpFilePath, fileBuffer);

  return tmpFilePath;
} 
app.post('/start-script', (req, res) => {
  const { csv_name, sep = ' ', excel_name = ' ', sheet_name = ' ' } = req.body;

  console.log(csv_name, sep, excel_name, sheet_name)

  const runExeTmpPath = copyAssetToTmp('../build/CSV-To-Excel.exe');

  const args = [
    csv_name,
    sep,
    excel_name,
    '--sheet_name',
    sheet_name
  ];

  const pyProcess = spawn(runExeTmpPath, args);

  let stdout = '';
  let stderr = '';

  pyProcess.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  pyProcess.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  pyProcess.on('error', (err) => {
    console.error('Execution error CSV-To-Excel.exe:', err);
    res.sendStatus(500);
  });

  pyProcess.on('close', (code) => {
    if (code === 0) {
      console.log('CSV-To-Excel.exe succesfuly run:', stdout);
      res.sendStatus(200);
    } else {
      console.error('CSV-To-Excel.exe terminated with error code:', code);
      console.error('stderr:', stderr);
      res.status(500).send(stderr || 'Execution error CSV-To-Excel.exe');
    }
  });
});


const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, '../frontend'));

liveReloadServer.server.once("connection", () => {
  console.log("🔁 LiveReload client connected.");
});

const frontendPath = path.join(__dirname, '../frontend');

const watcher = chokidar.watch(frontendPath, {
  ignoreInitial: true,
  usePolling: true,
  interval: 100,
});

watcher.on('change', () => {
  liveReloadServer.refresh('/');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);


  const runExeTmpPath = copyAssetToTmp('../build/run.exe');

  const pyProcess = spawn(runExeTmpPath, []);
  
  let stdout = '';
  let stderr = '';

  pyProcess.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  pyProcess.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  pyProcess.on('error', (err) => {
    console.error('Execution error python_part.exe:', err);
  });

  pyProcess.on('close', (code) => {
    if (code === 0) {
      console.log('python_part.exe succesfuly run:', stdout);
    } else {
      console.error('python_part.exe terminated with error code:', code);
      console.error('stderr:', stderr);
    }
  });
});
