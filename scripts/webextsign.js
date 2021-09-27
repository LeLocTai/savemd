
const { exec } = require('child_process');
require('dotenv').config()

exec(`web-ext sign --source-dir dist/webext-prod --channel=unlisted`, (err, stdout, stderr) =>
{
    console.log(err);
    console.log(stdout);
    console.error(stderr);
})