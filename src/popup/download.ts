import { browser } from "webextension-polyfill-ts";
import { Options } from "../option/options-storage";

export async function download(page: Page, options: Options)
{
    const mdObjUrl = URL.createObjectURL(new Blob([page.md], { type: 'text/markdown;charset=utf-8' }))
    const mdFilePath = options.mdPath + page.title + '.md'
    const imagePath = options.imgPath.replaceAll('{title}', page.title)

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

    for (const [imgName, imgUrl] of Object.entries(page.imgs))
    {
        browser.downloads.download({
            url: imgUrl,
            filename: imagePath + imgName,
            conflictAction: 'overwrite'
        })
    }
}