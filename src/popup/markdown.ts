import TurndownService from '@joplin/turndown'
import { gfm } from '@joplin/turndown-plugin-gfm'
import { Images } from './page'

export function html2md(html, baseUrl, imagePath)
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

    const imgs: Images = {};

    turndown.addRule('img', {
        filter: function (node)
        {
            return node.nodeName === 'IMG' && node.getAttribute('src');
        },

        replacement: function (content, node, options)
        {
            const alt = node.getAttribute('alt') || ''
            const src = node.getAttribute('src')


            const srcUrl = new URL(src, baseUrl)
            const name = srcUrl.pathname.substring(srcUrl.pathname.lastIndexOf('/') + 1)
            let savedName = name

            let dupCount = 1;
            while (imgs.hasOwnProperty(savedName))
            {
                savedName = name + ` (${dupCount++})`
            }

            imgs[savedName] = srcUrl.href

            const savedURI = encodeURI(`${imagePath}${savedName}`)

            return `![${alt}](${savedURI})`;
        }
    })

    let md: string = turndown.turndown(html)

    md = md.replaceAll(/(\$\$[\S\s]+?(\$\$)[^\r\n])/gm, '$1\n')
    md = md.replaceAll('\xa0', ' ')

    return { md, imgs }
}