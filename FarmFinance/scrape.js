const https = require('https');

function fetchUrls() {
  https.get('https://coverr.co/s?q=sunny', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const matches = [];
      const regex = /https:\/\/[^\s\"\'\>]+?\.mp4/g;
      let m;
      while((m = regex.exec(data)) !== null) { matches.push(m[0]); }
      console.log("Sunny:", matches.slice(0, 1));
    });
  });
}
fetchUrls();
