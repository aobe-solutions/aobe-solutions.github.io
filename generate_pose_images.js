/**
 * REPEATABLE GEMINI POSE GENERATOR & DATA INTEGRATOR
 * 
 * Usage:
 *   node generate_pose_images.js --title "Sunset Theater Archway" --category "Theater & Performing Arts" --vibe "Dreamy" --gender "female" --prompt "High school senior girl in red formal dress under historic theater archway during golden hour sunset"
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Read command line arguments
const args = process.argv.slice(2);
function getArg(flag, fallback = '') {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const title = getArg('--title', 'New Senior Portrait Pose');
const category = getArg('--category', 'Nature & Outdoors');
const vibe = getArg('--vibe', 'Dreamy');
const gender = getArg('--gender', 'female'); // 'female' or 'male'
const outfit = getArg('--outfit', 'Casual / Dress');
const props = getArg('--props', 'Natural Environment');
const isLocalSpot = getArg('--local', 'false') === 'true';
const promptText = getArg('--prompt', 'High school senior portrait pose during golden hour sunset.');

const fileSlug = title.toLowerCase().replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
const filename = `${fileSlug}.png`;
const relPath = `images/locations/${filename}`;
const fullSavePath = path.join(__dirname, 'images', 'locations', filename);

console.log('====================================================');
console.log('📸 REPEATABLE SENIOR PORTRAIT POSE GENERATOR');
console.log('====================================================');
console.log(`Title: ${title}`);
console.log(`Category: ${category} | Vibe: ${vibe} | Gender: ${gender}`);
console.log(`Target Image File: ${relPath}`);
console.log(`Prompt: "${promptText}"`);
console.log('----------------------------------------------------');

// Helper to call Gemini Imagen API via HTTP request if GEMINI_API_KEY environment variable is set
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

async function generateImageWithGemini() {
  if (!apiKey) {
    console.log('⚠️ GEMINI_API_KEY environment variable not set.');
    console.log('👉 Creating lightweight placeholder entry template. To generate real images via API, set GEMINI_API_KEY=your_key');
    
    // Create SVG/Canvas placeholder if API key not available
    const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="50%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="1600" fill="url(#g)"/>
      <circle cx="600" cy="700" r="300" fill="#2dd4bf" opacity="0.15"/>
      <text x="600" y="750" font-family="sans-serif" font-size="42" font-weight="bold" fill="#2dd4bf" text-anchor="middle">${title}</text>
      <text x="600" y="820" font-family="sans-serif" font-size="28" fill="#a855f7" text-anchor="middle">${category} • ${vibe}</text>
    </svg>`;
    
    fs.writeFileSync(fullSavePath, placeholderSvg);
    console.log(`✅ Saved placeholder image template to: ${fullSavePath}`);
    return;
  }

  console.log('🚀 Invoking Gemini Flash Image Generation API...');

  const reqBody = JSON.stringify({
    contents: [{
      parts: [{
        text: `A professional, high-resolution 8k senior portrait photo: ${promptText}. Natural lighting, bokeh background, photorealistic.`
      }]
    }]
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(reqBody)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          if (json.predictions && json.predictions[0] && json.predictions[0].bytesBase64Encoded) {
            const buffer = Buffer.from(json.predictions[0].bytesBase64Encoded, 'base64');
            fs.writeFileSync(fullSavePath, buffer);
            console.log(`🎉 SUCCESS! Generated image saved to: ${fullSavePath}`);
            resolve();
          } else {
            console.log('API response:', responseData.slice(0, 300));
            resolve();
          }
        } catch (e) {
          console.error('Error parsing response:', e.message);
          resolve();
        }
      });
    });

    req.on('error', (e) => {
      console.error('Network request failed:', e.message);
      resolve();
    });

    req.write(reqBody);
    req.end();
  });
}

// Append new entry to locations_data.js
function appendToLocationsData() {
  const dataFile = 'locations_data.js';
  const dataContent = fs.readFileSync(dataFile, 'utf8');
  const locations = eval(dataContent + '; LOCATIONS_DATA;');

  const newId = `pose_${Date.now()}_${fileSlug}`;

  // Avoid duplicates
  const existingIdx = locations.findIndex(item => item.id === newId || item.title === title);
  
  const newItem = {
    id: newId,
    title: title,
    category: category,
    vibe: vibe,
    outfit: outfit,
    props: props,
    gender: gender,
    isLocalSpot: isLocalSpot,
    poseDescription: `Full-length or three-quarter pose: ${promptText}`,
    originalLocation: isLocalSpot ? "Parker & Hood County Local Spot" : "Featured Senior Portrait Scenario",
    originalCaption: `Custom pose scenario: ${promptText}`,
    imageLocalPath: relPath,
    googleMapsQuery: `${category.toLowerCase()} photography location`
  };

  if (existingIdx !== -1) {
    locations[existingIdx] = newItem;
    console.log(`🔄 Updated existing pose entry for: "${title}"`);
  } else {
    locations.push(newItem);
    console.log(`➕ Appended new pose entry to locations_data.js (Total items: ${locations.length})`);
  }

  fs.writeFileSync(dataFile, `const LOCATIONS_DATA = ${JSON.stringify(locations, null, 2)};\n`);
}

async function run() {
  await generateImageWithGemini();
  appendToLocationsData();
  console.log('====================================================');
  console.log('✨ DONE! Refresh http://localhost:8085/senior-portrait-scout.html to view your new pose!');
  console.log('====================================================');
}

run();
