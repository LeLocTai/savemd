import TurndownService from '@joplin/turndown'
import { gfm } from '@joplin/turndown-plugin-gfm'
import contentDisposition from 'content-disposition'
import * as mime from 'mime-types'
import path from 'path-browserify'
import { shortenName } from '../utils'
import { PageImage } from './page'

export async function html2md(html, baseUrl, imagePath)
{
    const imgs: PageImage[] = []
    const imgNames = new Map<string, PageImage>()
    const imgJobs: Promise<any>[] = []

    async function fetchImageData(src: string)
    {
        const srcUrl = new URL(src, baseUrl)
        const name = srcUrl.pathname.substring(srcUrl.pathname.lastIndexOf('/') + 1)
        let fileName = name

        let imgRes: Response | null = null

        try
        {
            imgRes = await fetch(srcUrl.href, { method: 'HEAD' })
        } catch { }

        if (imgRes !== null)
        {
            const cd = imgRes.headers.get('content-disposition')
            if (cd)
            {
                const cdname = contentDisposition.parse(cd).parameters['filename']
                if (cdname)
                    fileName = cdname
            }

            const contentType = imgRes.headers.get('content-type')
            if (contentType !== null)
            {
                const derivedExt = mime.extension(contentType)
                if (derivedExt && !fileName.endsWith(derivedExt))
                    fileName += '.' + derivedExt
            }
        }

        const savedNamePathObj = path.parse(fileName)
        fileName = shortenName(savedNamePathObj.name, 100) + savedNamePathObj.ext

        const existingImg = imgNames.get(fileName)
        if (existingImg === undefined || existingImg.src !== srcUrl.href)
        {
            let dupCount = 1;
            while (imgs.hasOwnProperty(fileName))
            {
                fileName = name + ` (${dupCount++})`
            }

            const newImg = {
                src: srcUrl.href,
                fileName
            }

            imgNames.set(fileName, newImg)
            imgs.push(newImg)
        }
    }

    const turndownPrepass = new TurndownService()
    turndownPrepass.addRule('img', {
        filter: node =>
        {
            return imgFilter(node) || wpImgFilter(node)
        },
        replacement: (content, node: HTMLLinkElement | HTMLImageElement, options) =>
        {
            let src: string | null = null;
            if (node.tagName === 'IMG')
                src = imgData(node as HTMLImageElement).src
            else if (node.tagName === 'A')
                src = wpImgData(node as HTMLLinkElement).src

            if (src === null)
                return

            imgJobs.push(fetchImageData(src))
        }
    })

    turndownPrepass.turndown(html)

    await Promise.all(imgJobs)

    const imgsBySrc = new Map<string, PageImage>()
    for (const img of imgs)
    {
        imgsBySrc.set(img.src, img)
    }

    const turndown = new TurndownService({
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
        filter: imgFilter,
        replacement: function (content, node: HTMLImageElement, options)
        {
            const { src, alt } = imgData(node)
            const img = imgsBySrc.get(src)!
            const savedURI = encodeURI(`${imagePath}${img.fileName}`)

            // console.log('img', savedURI)

            return `![${alt}](${savedURI})`;
        }
    })

    turndown.addRule('wordpress img', {
        filter: wpImgFilter,
        replacement: function (content, node: HTMLLinkElement, options)
        {
            const { src, alt } = wpImgData(node)
            const img = imgsBySrc.get(src)!
            const savedURI = encodeURI(`${imagePath}${img.fileName}`)

            // console.log('wpimg', savedURI)

            return `![${alt}](${savedURI})`;
        }
    })

    turndown.addRule('wordpress latex img', {
        filter: function (node: HTMLElement)
        {
            if (node.nodeName !== 'IMG') return false;

            const src = node.getAttribute('src')
            if (src === null) return

            const srcUrl = new URL(src, baseUrl)

            if (!srcUrl.hostname.endsWith('wp.com')) return false

            const latex = srcUrl.searchParams.get('latex')
            if (latex === null) return false

            return true
        },
        replacement: function (content, node: HTMLImageElement, options)
        {
            const srcUrl = new URL(node.src, baseUrl)
            const latex = srcUrl.searchParams.get('latex')

            return `$${latex}$`;
        }
    })


    let md: string = turndown.turndown(html)

    md = md.replaceAll(/(\$\$[\S\s]+?(\$\$)[^\r\n])/gm, '$1\n')
    md = md.replaceAll('\xa0', ' ')

    return { md, imgs }
}

function imgFilter(node: HTMLElement)
{
    return node.nodeName === 'IMG' && node.getAttribute('src') !== null;
}

function imgData(node: HTMLImageElement)
{
    return { src: node.src, alt: node.alt }
}

function wpImgFilter(node: HTMLElement)
{
    if (node.nodeName !== 'A') return false

    let href = node.getAttribute('href')

    if (href === null) return false

    href = href.split('?')[0]

    const innerImgs = Array.from(node.querySelectorAll('img'))
    if (innerImgs.length === 0) return false

    return innerImgs.some(img =>
    {
        const src = img.src.split('?')[0]

        if (src === href) return true

        const matches = src.match(/(.+?)-?\d+x\d+(.\w+)/)

        if (!matches) return false
        if (matches.length < 3) return false

        const srcNoSize = matches[1] + matches[2]

        if (srcNoSize === href) return true
    })
}

function wpImgData(node: HTMLLinkElement)
{
    const img: HTMLImageElement = Array.from(node.querySelectorAll('img')).find(img => img.src)!

    // if (img.src !== node.href)
    //     console.log(`Replaced ${img.src} with ${node.href}`)
    return { src: node.href.split('?')[0], alt: img.alt || '' }
}