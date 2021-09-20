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
            width: 30em;
            font-family: sans-serif;
        }

        #main {
            padding: 16px;
        }

        input, textarea{
            display: block;
            width: 100%;
        }

        textarea{
            resize: vertical;
        }

        #title {
            font-family: sans-serif;
            font-size: 1.2em;
            font-weight: bold;
        }

        #preview {
            white-space: pre-wrap;
        }

        #download{
            padding: .5em;
            width: 100%;
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
            <textarea id='title' rows=1>${this.page.title}</textarea>
            <p><textarea id="preview" rows=15>${this.page.md}</textarea></p>
            <p><label for="tags">Tags: </label><input id="tags" type="text"></p>
            <p><label for="path">Path: </label><input id="path" type="text" value="${this._savePath}"
                    @input="${this._savePathChanged}"></p>
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