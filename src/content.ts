import { browser } from "webextension-polyfill-ts";

browser.runtime.onMessage.addListener((msg) =>
{
    switch (msg.cmd)
    {
        case 'want-html': giveHtml()
    }
})

function giveHtml()
{
    browser.runtime.sendMessage({ cmd: 'give-html', payload: document.documentElement.outerHTML })
}
