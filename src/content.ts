import { browser } from "webextension-polyfill-ts";

browser.runtime.onMessage.addListener(async (msg) =>
{
    switch (msg.cmd)
    {
        case 'want-html': return document.documentElement.outerHTML
    }

    throw 'Unhandle message: ' + msg.cmd
})
