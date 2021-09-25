
const { exec } = require('child_process');
require('dotenv').config()

exec(`web-ext sign ---source-dir dist/webext-prod`, (err, stdout, stderr) =>
{
    console.log(stdout);
    console.error(stderr);
})