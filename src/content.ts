import browser from "webextension-polyfill";

browser.runtime.onMessage.addListener(async (msg) =>
{
    switch (msg.cmd)
    {
        case 'want-html': return {
            url: window.location.href,
            title: document.title,
            body: document.documentElement.outerHTML
        }
    }

    throw 'Unhandle message: ' + msg.cmd
})