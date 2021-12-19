import { isProbablyReaderable, Readability } from "@mozilla/readability";
import path from "path-browserify";
import sanitize from 'sanitize-filename';
import browser from "webextension-polyfill";
import { Article } from "../document";
import { Options } from "../option/options-storage";
import { ensureTrailingSlash } from "../utils";
import { html2md } from "./markdown";

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
    sourceTitle: string;
    title: string;
    md!: string;
    imgs!: Images;
    shouldSimplify: boolean;
    simplify: boolean;

    _dom: Document;

    get shortTitle()
    {
        return this.title.length <= 60 ? this.title : this.title.substring(0, 60) + '_'
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

        this.sourceTitle = document.title

        this.recalculate(options)

        let title = this.sourceTitle.trim()
            .replace(/\.$/, '')
        title = sanitize(title, { replacement: '' })
        this.title = title
    }

    recalculate(options: Options)
    {
        const mdPath = this.evalTemplate(options.mdPath)
        let imagePath = ensureTrailingSlash(this.evalTemplate(options.imgPath))
        imagePath = ensureTrailingSlash(path.relative(path.dirname(mdPath), imagePath))


        let html: string | undefined

        if (this.simplify)
        {
            const simplifyResult = this.simplifyArticle()
            if (simplifyResult)
            {
                html = simplifyResult.html
                this.sourceTitle = simplifyResult.title
            }
        }

        if (!html)
        {
            html = this._dom.body.outerHTML
        }

        let { md, imgs } = html2md(html, this.url, imagePath)
        md = this.evalTemplate(options.frontMatter) + md

        this.md = md
        this.imgs = imgs

        return this
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

    evalTemplate(template)
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