
const fetch = require('node-fetch');
fetch('http://127.0.0.1:3002/api/debug-network')
    .then(res => res.json())
    .then(json => console.log(JSON.stringify(json, null, 2)))
    .catch(err => console.error(err));
