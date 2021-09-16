const fs = require("fs");
const path = require("path");
const { exec } = require('child_process');

const testFilePath = path.resolve('./test.html')

function run(args)
{
    exec('web-ext run --source-dir dist/webext-dev --start-url ' + args, (err, stdout, stderr) =>
    {
        if (err)
        {
            console.error(err);
            return;
        }

        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    })
}


if (fs.existsSync(testFilePath))
{
    run('file:///' + testFilePath)
} else
{
    run()
}