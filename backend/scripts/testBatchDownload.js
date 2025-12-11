const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const supabase = require('../src/config/supabase');
const { initAutoProxyRefresh, getProxyAgent, rotateProxy, getCurrentProxyUrl } = require('../src/utils/proxyManager');

const YOUTUBE_URLS = [
  "https://youtu.be/2hGEiQg9X_g?si=llddec78ipi74_4L",
  "https://youtu.be/izbydia9jz4?si=GAYErVmN-7n4CKmo",
  "https://youtu.be/RPTfXa_4jPg?si=62YqLgsby2r6AQZg",
  "https://youtu.be/MwtKJG_87fw?si=vi2Vu_qvKuYekpQ_",
  "https://youtu.be/PAhTLB1LBR0?si=WUHJzKs3Ig3bw3rk",
  "https://youtu.be/9iX4HQeW1aM?si=ngxkCqv4f8_Ka0p3",
  "https://youtu.be/naGxpB5FbXw?si=NsVdz7-DhvBRjmVd",
  "https://youtu.be/dsrku40uZMc?si=9QAZxyHGqst9ANVa",
  "https://youtu.be/bdHWFi5NfR0?si=uA7xxk6AkUZnqzeM",
  "https://youtu.be/oL4SC97QBoU?si=YktiEmNtEIb7eQ3d",
  "https://youtu.be/XWlWvLauIrg?si=fwLCnSsTfXfM8eZH",
  "https://youtu.be/hnemFzjQUSM?si=_t6_UwZLXCZ6437d",
  "https://youtu.be/UgjtxhV08Ao?si=rFZ07aUHjn54AJxa",
  "https://youtu.be/A64oFRutkeI?si=iSnuipgFqY6FLncs",
  "https://youtu.be/cEWwJxEq9Lg?si=ZRaYj5dgtymToVZz",
  "https://youtu.be/ti4fD2or_6s?si=VH3zfWf4NnzLJW7V",
  "https://youtu.be/Zy_KwCohQd0?si=_L0zkY8mxQ7AMW0V",
  "https://youtu.be/XnHLmsClbP4?si=WGXbFcMLeQe0Lxl-",
  "https://youtu.be/k9_JbEaRxso?si=C7EYtfO2BxGmYjMs",
  "https://youtu.be/AIFjQ3RIAOQ?si=UkKEV9UvQdWNI8Ez",
  "https://youtu.be/CpjbtSzVOz8?si=OayGyNhfS6jEcaC6",
  "https://youtu.be/qOBCyC0khCc?si=j9Bi6eYuYqkiKKVb",
  "https://youtu.be/N5pP7k7qppE?si=2v-tmKGWlHJ9m517",
  "https://youtu.be/jRDCWQP7rjI?si=vWuaCdyBTUM9q0S_",
  "https://youtu.be/NOeMYlFuEmk?si=aPHgazS_YGToqOLs",
  "https://youtu.be/rlXZROSltGk?si=Zz1TELw7rc5n32XI"
];

// Configuration
const BUCKET_NAME = 'music_assets';
const DOWNLOAD_DIR = path.join(__dirname, 'temp_downloads');

if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

// Find yt-dlp binary
const ytDlpPath = path.join(__dirname, '../yt-dlp.exe');

async function downloadWithProxy(url, retries = 2) {
  let attempt = 0;
  const videoId = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/)?.[1];
  
  if (!videoId) {
    console.error(`Invalid URL: ${url}`);
    return null;
  }

  const outputFile = path.join(DOWNLOAD_DIR, `${videoId}.m4a`);

  while (attempt <= retries) {
    const proxyUrl = getCurrentProxyUrl(); 
    console.log(`[${attempt+1}/${retries+1}] Downloading ${videoId} via ${proxyUrl}...`);

    try {
      // Construct Command
      let cmd = `"${ytDlpPath}" -f "bestaudio[ext=m4a]" -o "${outputFile}" "${url}" --force-ipv4`;
      
      // Inject proxy if available
      if (proxyUrl && proxyUrl !== 'DIRECT') {
        cmd += ` --proxy "${proxyUrl}"`;
      }
      
      // Execute
      await execPromise(cmd, { timeout: 60000 }); // 60s timeout

      // Init verify
      if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 0) {
        console.log(`[Success] Downloaded ${videoId}`);
        return outputFile;
      } else {
        throw new Error('File not found or empty after download');
      }

    } catch (err) {
      console.warn(`[Fail] Download failed via ${proxyUrl}: ${err.message.split('\n')[0]}`); // Only show first line of error
      
      // Rotate if it was a proxy failure (likely)
      if (proxyUrl !== 'DIRECT') {
        rotateProxy();
      }
      attempt++;
    }
  }
  
  console.error(`[GiveUp] Could not download ${videoId} after ${retries + 1} attempts`);
  return null;
}

async function uploadToSupabase(filePath, fileName) {
  try {
    const fileContent = fs.readFileSync(filePath);
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`songs/test_batch/${fileName}`, fileContent, {
        contentType: 'audio/mp4',
        upsert: true
      });

    if (error) throw error;
    console.log(`[Upload] Uploaded to Supabase: ${data.path}`);
    return true;
  } catch (err) {
    console.error(`[Upload] Failed: ${err.message}`);
    return false;
  }
}

// MAIN
(async () => {
  console.log('--- Starting Batch Download Test (Proxy-Enabled) ---');
  
  // 1. Init Proxies
  await initAutoProxyRefresh({ intervalMs: 24 * 3600 * 1000 }); 
  
  // 2. Process URLs
  let successCount = 0;
  
  for (const url of YOUTUBE_URLS) {
    console.log(`\nProcessing: ${url}`);
    
    // Download
    const localPath = await downloadWithProxy(url);
    
    if (localPath) {
      // Upload
      const fileName = path.basename(localPath);
      const uploaded = await uploadToSupabase(localPath, fileName);
      
      if (uploaded) {
        successCount++;
        // Cleanup
        fs.unlinkSync(localPath);
      }
    }
  }

  console.log(`\n--- Batch Complete ---`);
  console.log(`Success: ${successCount} / ${YOUTUBE_URLS.length}`);
  process.exit(0);
})();
