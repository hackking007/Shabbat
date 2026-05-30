const https = require('https');
const searches = ['לכה דודי לקראת שבת', 'שבת המלכה', 'לכבוד שבת קודש'];

async function searchYoutube(q) {
  return new Promise((resolve, reject) => {
    https.get('https://www.youtube.com/results?search_query=' + encodeURIComponent(q), res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/"videoId":"([^"]+)"/);
        if (match) {
          resolve(match[1]);
        } else {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  for (const q of searches) {
    const id = await searchYoutube(q);
    console.log(`${q} -> ${id}`);
  }
}

run();
