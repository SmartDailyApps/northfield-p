import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const studioImagesDir = path.resolve(__dirname, '../../smartdailyapps-website/images');

async function optimize() {
  const images = ['logo-icon.png', 'sda-v3-a1-all.png', 'sda-v3-og-all.png', 'sda-v4-hero-bg.png'];
  
  for (const file of images) {
    const inputPath = path.join(studioImagesDir, file);
    const tempPath = path.join(studioImagesDir, `temp-${file}`);
    
    let pipeline = sharp(inputPath);
    if (file === 'logo-icon.png') {
        pipeline = pipeline.resize(512, 512);
    }
    
    await pipeline
      .png({
        quality: 80,
        compressionLevel: 9,
        palette: true
      })
      .toFile(tempPath);
      
    fs.renameSync(tempPath, inputPath);
    console.log(`Optimized ${file}`);
  }
}

optimize().catch(console.error);
