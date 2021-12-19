import { isProbablyReaderable, Readability } from "@mozilla/readability";
import path from "path-browserify";
import sanitize from 'sanitize-filename';
import browser from "webextension-polyfill";
import { Article } from "../document";
import { Options } from "../option/options-storage";
import { ensureTrailingSlash } from "../utils";
import { html2md } from "./markdown";
import { md5 } from "../lib/md5.js";

export type Images = { [key: string]: string }

export async function getCurrentPage(options: Options)
{
    const activeTabs = await browser.tabs.query({ active: true, currentWindow: true, })
    const id = activeTabs[0].id

    if (!id) return undefined;

    let document: Article;

    while (true)
    {
        try
        {
            document = await browser.tabs.sendMessage(id, { cmd: 'want-html' })
            break
        } catch {
            await new Promise(r => setTimeout(r, 500))
            continue
        }
    }

    let page = new Page(document, options)

    return page
}

export class Page
{
    url: string;
    title!: string;
    md!: string;
    imgs!: Images;
    shouldSimplify: boolean;
    simplify: boolean;

    _dom: Document;

    get shortTitle()
    {
        const title = this.title
        const hash = md5(title).slice(-6)

        return title.length <= 60 ? title : title.substring(0, 60) + '_' + hash
    }

    constructor(document: Article, options: Options)
    {
        this.url = document.url

        this._dom = new DOMParser().parseFromString(document.html, 'text/html')
        // Readability need baseUrl to correctly resolves relative link
        // Otherwise it assume the baseUrl context, popup.html in this case
        const head = this._dom.head
        if (head.getElementsByTagName('base').length === 0)
        {
            let baseEl = this._dom.createElement('base');
            baseEl.setAttribute('href', this.url);
            this._dom.head.appendChild(baseEl);
        }
        this.simplify = this.shouldSimplify = isProbablyReaderable(this._dom)

        this.recalculate(options)
    }

    recalculate(options: Options)
    {
        let html: string | undefined

        if (this.simplify)
        {
            const simplifyResult = this.simplifyArticle()
            if (simplifyResult)
            {
                html = simplifyResult.html
                if (!this.title)
                {
                    this.title = this.sanitizeTitle(simplifyResult.title)
                }
            }
        }

        if (!this.title)
        {
            this.title = this.sanitizeTitle(document.title)
        }

        if (!html)
        {
            html = this._dom.body.outerHTML
        }

        const mdPath = this.evalTemplate(options.mdPath)
        let imagePath = ensureTrailingSlash(this.evalTemplate(options.imgPath))
        imagePath = ensureTrailingSlash(path.relative(path.dirname(mdPath), imagePath))

        let { md, imgs } = html2md(html, this.url, imagePath)
        md = this.evalTemplate(options.frontMatter) + md

        this.md = md
        this.imgs = imgs

        return this
    }

    private sanitizeTitle(title)
    {
        title = title.trim().replace(/\.$/, '')
        title = sanitize(title, { replacement: '' })
        return title
    }

    private simplifyArticle()
    {
        const documentClone = this._dom.cloneNode(true) as Document;
        const simplified = new Readability(documentClone).parse()

        if (!simplified)
            return null

        const simplifiedDom = new DOMParser().parseFromString(simplified.content, 'text/html')
        simplifiedDom.querySelectorAll('[id^=MathJax-Element-').forEach(node =>
        {
            const mathSrcId = node.id.slice(0, -6)
            const mathSrc = this._dom.getElementById(mathSrcId)
            if (mathSrc)
                node.parentNode?.insertBefore(mathSrc, node.nextSibling)

            node.remove()
        })

        return {
            title: simplified.title,
            html: simplifiedDom.body.outerHTML
        }
    }

    evalTemplate(template: string)
    {
        return evalTemplate(template, {
            title: this.title,
            shortTitle: this.shortTitle,
            url: this.url,
            date: new Date().toISOString()
        })
    }
}

function evalTemplate(template: string, data: object)
{
    const keys = Object.keys(data)

    let result = template
    for (let key of keys)
    {
        result = result.replaceAll(`{${key}}`, data[key])
    }

    return result
}