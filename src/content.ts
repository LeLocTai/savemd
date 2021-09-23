import browser from "webextension-polyfill";
import { Article } from "./document";

browser.runtime.onMessage.addListener(async (msg) =>
{
    switch (msg.cmd)
    {
        case 'want-html': return {
            url: window.location.href,
            title: document.title,
            html: document.documentElement.outerHTML
        } as Article
    }

    throw 'Unhandle message: ' + msg.cmd
})