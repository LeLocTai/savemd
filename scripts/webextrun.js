const fs = require("fs");
const path = require("path");
const { exec } = require('child_process');

const testFilePath = path.resolve('./test.html')

function run(args)
{
    exec('web-ext run --source-dir dist --start-url ' + args, (err, stdout, stderr) =>
    {
        console.log(stdout);
        console.error(stderr);
    })
}


if (fs.existsSync(testFilePath))
{
    run('file:///' + testFilePath)
} else
{
    run()
}