const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const PB_VERSION = '0.22.25';
const DOWNLOAD_URL = `https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_windows_amd64.zip`;
const DEST_DIR = path.join(__dirname, '..', 'pocketbase');
const ZIP_PATH = path.join(DEST_DIR, 'pocketbase.zip');

if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

function downloadFile(url, targetPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      // Follow HTTP redirects (301, 302, 307, 308)
      if ([301, 302, 307, 308].includes(response.statusCode) && response.headers.location) {
        return downloadFile(response.headers.location, targetPath).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
      }

      const fileStream = fs.createWriteStream(targetPath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close(resolve);
      });

      fileStream.on('error', (err) => {
        fs.unlink(targetPath, () => reject(err));
      });
    }).on('error', reject);
  });
}

async function setup() {
  try {
    console.log(`Downloading PocketBase v${PB_VERSION}...`);
    await downloadFile(DOWNLOAD_URL, ZIP_PATH);

    console.log('Extracting archive...');
    execSync(`powershell -Command "Expand-Archive -Path '${ZIP_PATH}' -DestinationPath '${DEST_DIR}' -Force"`);
    
    if (fs.existsSync(ZIP_PATH)) {
      fs.unlinkSync(ZIP_PATH);
    }

    console.log('PocketBase setup complete!');
  } catch (err) {
    if (fs.existsSync(ZIP_PATH)) {
      fs.unlinkSync(ZIP_PATH);
    }
    console.error('Download failed:', err.message);
  }
}

setup();