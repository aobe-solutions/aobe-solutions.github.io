const fs = require('fs');
const path = require('path');
const https = require('https');

const imagesDir = path.join(__dirname, 'images', 'locations');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const imageList = [
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_boy_golf_course_location.jpg', filename: 'golf_course.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_girl_library-scaled.jpg', filename: 'library.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_vintage_car.jpg', filename: 'vintage_car.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_arcade.jpg', filename: 'arcade.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_girl_sunset_field-1.jpg', filename: 'sunset_field.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_boy_lake_location.jpg', filename: 'lake_boy.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_girl_lake_location.jpg', filename: 'lake_girl.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_girl_barn-scaled.jpg', filename: 'barn_white_dress.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/02/senior_barn_location.jpg', filename: 'red_barn.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_wildflowers.jpg', filename: 'wildflowers.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_sunflowers.jpg', filename: 'sunflowers.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_boy_beach.jpg', filename: 'beach_boy.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_girl_beach.jpg', filename: 'beach_jetties.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/brinolesfb.jpg', filename: 'beach_palm_trees.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/02/senior_urban_location-scaled.jpg', filename: 'gallatin_square_urban.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/02/senior_industrial_location.jpg', filename: 'urban_door_wall.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_amelias_flower_truck.jpg', filename: 'flower_truck.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_girl_urban_nashville_gulch.jpg', filename: '12south_ivy_wall.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/urban_senior_girl_metal_stairs.jpg', filename: '12south_metal_stairs.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_girl_urban_city.jpg', filename: 'gulch_urban_city.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_girl_printers_alley.jpg', filename: 'printers_alley.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/urban_alley_senior_girl.jpg', filename: 'mural_alley.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_graffiti_wall.jpg', filename: 'graffiti_wall.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_girl_rooftop_parking_lot.jpg', filename: 'rooftop_parking.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/nashville_pedestrian_bridge_seniorshoot-scaled.jpg', filename: 'pedestrian_bridge.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_girl_capital_building-1-scaled.jpg', filename: 'capitol_building.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/02/senior_outdoor_location.jpg', filename: 'rocky_construction.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_girl_industrial_location.jpg', filename: 'chain_link_fence_girl.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/01/abigail_senior_SPP_21.jpg', filename: 'chain_link_fence_colorful.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_boy_urban-1.jpg', filename: 'metal_garage_door.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_boy_high_school_bleachers.jpg', filename: 'high_school_bleachers.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_boy_high_school_track-scaled.jpg', filename: 'high_school_track.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_football_field.jpg', filename: 'football_field_lacrosse.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_baseball_field.jpg', filename: 'baseball_field.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/03/senior_boy_letter_jacket.jpg', filename: 'campus_letter_jacket.jpg' },
  { url: 'https://shannonpaynephotography.com/wp-content/uploads/2021/02/senior_studio-scaled.jpg', filename: 'studio_headshot.jpg' }
];

async function downloadImage(item) {
  const dest = path.join(imagesDir, item.filename);
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(item.url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      } else {
        fs.unlink(dest, () => {});
        reject(new Error(`Failed to download ${item.url}: HTTP ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function downloadAll() {
  console.log(`Downloading ${imageList.length} images to ${imagesDir}...`);
  for (const item of imageList) {
    try {
      await downloadImage(item);
      console.log(`✅ Saved ${item.filename}`);
    } catch (e) {
      console.error(`❌ ${item.filename}: ${e.message}`);
    }
  }
  console.log('Download complete!');
}

downloadAll();
