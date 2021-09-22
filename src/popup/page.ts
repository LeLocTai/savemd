import path from "path-browserify";
import sanitize from 'sanitize-filename';
import { Options } from "../option/options-storage";
import { ensureTrailingSlash } from "../utils";
import { html2md } from "./markdown";

export type Images = { [key: string]: string }

export class Page
{
    url: string;
    html: string;
    title: string;
    md!: string;
    imgs!: Images;

    get shortTitle()
    {
        return this.title.length <= 60 ? this.title : this.title.substring(0, 60) + '_'
    }

    constructor(document, options: Options)
    {
        let title = document.title
            .trim()
            .replace(/\.$/, '')
        title = sanitize(title, { replacement: '_' })

        this.title = title
        this.url = document.url
        this.html = document.body

        this.recalculate(options)
    }

    recalculate(options: Options)
    {
        const mdPath = this.evalTemplate(options.mdPath)
        let imagePath = ensureTrailingSlash(this.evalTemplate(options.imgPath))
        imagePath = ensureTrailingSlash(path.relative(path.dirname(mdPath), imagePath))

        let { md, imgs } = html2md(this.html, this.url, imagePath)
        md = this.evalTemplate(options.frontMatter) + md

        this.md = md
        this.imgs = imgs

        return this
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