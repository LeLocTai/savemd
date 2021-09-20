import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { download } from './download';
import { getPageMd } from './markdown';

@customElement('popup-main')
class PopupMain extends LitElement
{
    static styles = css`
        * {
            box-sizing: border-box;
        }

        :host {
            display:block;
            width: 20em;
        }

        #main {
            padding: 8px;
        }

        input, textarea{
            display: block;
            width: 100%;
        }

        #title {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        #preview {
            white-space: pre-wrap;
        }
    `;
    @state()
    protected page?: any

    @state()
    protected _savePath = "Documents/Notes"

    @state()
    protected working = false

    constructor()
    {
        super()

        this._updatePage()
    }


    async _updatePage()
    {
        this.working = true;
        this.page = await getPageMd()
        this.working = false;
    }

    _savePathChanged(e)
    {
        this._savePath = e.target.value;
    }

    _download()
    {
        if (!this.page)
            return

        download(this.page, this._savePath, this._savePath)
    }

    render()
    {
        const content = this.page
            ? html`
            <h2 id="title">${this.page.title}</h2>
            <p><label for="tags">Tags: </label><input id="tags" type="text"></p>
            <p><label for="path">Path: </label><input id="path" type="text" value="${this._savePath}"
                    @input="${this._savePathChanged}"></p>
            <p><textarea id="preview" rows=15>${this.page.md}</textarea></p>
            <p>${Object.keys(this.page.imgs).length || 0} images</p>
            <button id="download" @click="${this._download}" enabled=${!this.working}>Download</button>
`
            : html`...`

        return html`
        <div id="main">
            ${content}
        </div>
        `;
    }
}

declare global
{
    interface HTMLElementTagNameMap
    {
        'popup-main': PopupMain;
    }
}