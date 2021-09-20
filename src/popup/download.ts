import { browser } from "webextension-polyfill-ts";

export async function download(page: Page, mdPath: string, imgPath: string)
{
    if (!mdPath.endsWith('/')) mdPath += '/'
    if (!imgPath.endsWith('/')) imgPath += '/'

    const mdObjUrl = URL.createObjectURL(new Blob([page.md], { type: 'text/markdown;charset=utf-8' }))
    const mdFilePath = mdPath + page.title + '.md'

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
            filename: imgPath + page.title + '/' + imgName,
            conflictAction: 'overwrite'
        })
    }
}