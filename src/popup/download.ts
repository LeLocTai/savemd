import browser from "webextension-polyfill";
import { Options } from "../option/options-storage";
import { ensureTrailingSlash } from "../utils";
import { Page } from "./page";

export async function download(page: Page, options: Options)
{
    const mdObjUrl = URL.createObjectURL(new Blob([page.md], { type: 'text/markdown;charset=utf-8' }))
    const mdFilePath = page.evalTemplate(options.mdPath)
    const imagePath = ensureTrailingSlash(page.evalTemplate(options.imgPath))

    browser.downloads.onChanged.addListener(async (dl) =>
    {
        if (dl.id === mdDownloadId && dl.state?.current === 'complete')
        {
            URL.revokeObjectURL(mdObjUrl)
        }
    })

    const mdDownloadId = await browser.downloads.download({
        url: mdObjUrl,
        filename: mdFilePath,
        conflictAction: 'overwrite'
    })

    for (const img of page.imgs)
    {
        browser.downloads.download({
            url: img.src,
            filename: imagePath + img.fileName,
            conflictAction: 'overwrite'
        })
    }
}