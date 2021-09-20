import { browser } from "webextension-polyfill-ts";

browser.runtime.onMessage.addListener(async (msg) =>
{
    switch (msg.cmd)
    {
        case 'want-html': return {
            url: window.location.href,
            title: document.title,
            body: document.body.outerHTML
        }
    }

    throw 'Unhandle message: ' + msg.cmd
})
