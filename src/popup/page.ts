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
    title: string;
    md!: string;
    imgs!: Images;
    shouldSimplify: boolean;
    simplify: boolean;

    _dom: Document;

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


        let title = document.title

        let simplifiedArticle: any = null;
        if (this.simplify)
        {
            const documentClone = this._dom.cloneNode(true) as Document;
            simplifiedArticle = new Readability(documentClone).parse()
        }

        if (simplifiedArticle)
        {
            title = simplifiedArticle.title
        }

        title = title.trim()
            .replace(/\.$/, '')
        title = sanitize(title, { replacement: '_' })
        this.title = title

        this.recalculate(options, simplifiedArticle)
    }

    recalculate(options: Options, simplifiedArticle: any = null)
    {
        const mdPath = this.evalTemplate(options.mdPath)
        let imagePath = ensureTrailingSlash(this.evalTemplate(options.imgPath))
        imagePath = ensureTrailingSlash(path.relative(path.dirname(mdPath), imagePath))


        let html: string | undefined
        if (this.simplify)
        {
            if (!simplifiedArticle)
            {
                const documentClone = this._dom.cloneNode(true) as Document;
                simplifiedArticle = new Readability(documentClone).parse()
            }

            if (simplifiedArticle)
            {
                const simplifiedDom = new DOMParser().parseFromString(simplifiedArticle.content, 'text/html')
                simplifiedDom.querySelectorAll('[id^=MathJax-Element-').forEach(node =>
                {
                    const mathSrcId = node.id.slice(0, -6)
                    const mathSrc = this._dom.getElementById(mathSrcId)
                    if (mathSrc)
                        node.parentNode?.insertBefore(mathSrc, node.nextSibling)

                    node.remove()
                })

                html = simplifiedDom.body.outerHTML
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

    evalTemplate(template)
    {
        return evalTemplate(template, {
            title: this.title,
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