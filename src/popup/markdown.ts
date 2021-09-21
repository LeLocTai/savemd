import TurndownService from '@joplin/turndown'
import { gfm } from '@joplin/turndown-plugin-gfm'
import sanitize from 'sanitize-filename'
import { browser } from 'webextension-polyfill-ts'
import { Options } from '../option/options-storage'
import path from 'path-browserify'
import { ensureTrailingSlash } from '../utils'

export async function getPageMd(options: Options)
{
    const activeTabs = await browser.tabs.query({ active: true, currentWindow: true, })
    const id = activeTabs[0].id

    if (!id) return '';

    const document = await browser.tabs.sendMessage(id, { cmd: 'want-html' })

    let page: Page = {
        url: document.url,
        title: sanitize(document.title),
        imgs: {},
        md: ''
    }

    let imagePath = options.imgPath.replaceAll('{title}', page.title)
    imagePath = ensureTrailingSlash(path.relative(options.mdPath, imagePath))

    fillFromHtml(page, imagePath, document.body)

    return page
}

function fillFromHtml(page: Page, imagePath: string, html: string)
{
    var turndown = new TurndownService({
        headingStyle: 'atx',
        // anchorNames: options.anchorNames ? options.anchorNames.map(n => n.trim().toLowerCase()) : [],
        codeBlockStyle: 'fenced',
        // preserveImageTagsWithSize: !!options.preserveImageTagsWithSize,
        bulletListMarker: '-',
        emDelimiter: '*',
        strongDelimiter: '**',
        br: '',
    })
    turndown.use(gfm)
    turndown.remove('script');
    turndown.remove('style');

    turndown.addRule('mathjax-rendered-svg', {
        filter: function (node)
        {
            return node.nodeName === 'SPAN' && node.getAttribute('class') === 'MathJax_SVG';
        },

        replacement: function (content, node, options)
        {
            return '';
        }
    })

    turndown.addRule('img', {
        filter: function (node)
        {
            return node.nodeName === 'IMG' && node.getAttribute('src');
        },

        replacement: function (content, node, options)
        {
            const alt = node.getAttribute('alt') || ''
            const src = node.getAttribute('src')


            const srcUrl = new URL(src, page.url)
            const name = srcUrl.pathname.substring(srcUrl.pathname.lastIndexOf('/') + 1)
            let savedName = name

            let dupCount = 1;
            while (page.imgs.hasOwnProperty(savedName))
            {
                savedName = name + ` (${dupCount++})`
            }

            page.imgs[savedName] = srcUrl.href

            const savedURI = encodeURI(`${imagePath}${savedName}`)

            return `![${alt}](${savedURI})`;
        }
    })

    let md: string = turndown.turndown(html)

    md = md.replaceAll(/(\$\$[\S\s]+?(\$\$)[^\r\n])/gm, '$1\n')
    md = md.replaceAll('\xa0', ' ')

    page.md = md
}