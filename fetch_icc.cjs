const https = require('https');
https.get('https://raw.githubusercontent.com/saucecontrol/Compact-ICC-Profiles/master/profiles/sRGB-v2-micro.icc', (res) => {
  const data = [];
  res.on('data', (chunk) => data.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(data);
    console.log(buffer.toString('base64'));
  });
});
