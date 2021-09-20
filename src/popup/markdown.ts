import TurndownService from '@joplin/turndown'
import { gfm } from '@joplin/turndown-plugin-gfm'
import { browser } from 'webextension-polyfill-ts'

export async function getPageMd()
{
    const activeTabs = await browser.tabs.query({ active: true, currentWindow: true, })
    const id = activeTabs[0].id

    if (!id) return '';

    const html = await browser.tabs.sendMessage(id, { cmd: 'want-html' })

    return html2md(html)
}

function html2md(html)
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

    let md: string = turndown.turndown(html)

    md = md.replaceAll(/(\$\$[\S\s]+?(\$\$)[^\r\n])/gm, '$1\n')

    return md
}