import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import optionsStorage, { Options } from '../option/options-storage';

import '@spectrum-web-components/theme/sp-theme.js';
import '@spectrum-web-components/theme/theme-light.js';
import '@spectrum-web-components/theme/scale-medium.js';
import '@spectrum-web-components/field-label/sp-field-label.js';
import '@spectrum-web-components/textfield/sp-textfield.js';
import '@spectrum-web-components/button/sp-button.js';
import '@spectrum-web-components/progress-circle/sp-progress-circle.js';

import '../components/textarea';

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
            background: var(--spectrum-global-color-gray-100);
        }
        custom-textfield {
            width: 100%;
        }

        #preview {
            margin-top: .5em;
        }

        #download{
            padding: .5em;
            width: 100%;
        }
    `;

    titleStyle = css`
        .input {
            font-size: 1.2em;
            font-weight: bold;
        }
    `;

    previewStyle = css`
        :host([multiline]) textarea.input {
            width: 100% !important;
            height: 15em;
            min-height: 6em;
            max-height: 25em;
        }
    `;

    @state()
    protected page?: any

    @state()
    protected working = false

    @state()
    protected _options?: Options

    constructor()
    {
        super()

        this._loadOptions()
    }

    async _loadOptions()
    {
        this._options = await optionsStorage.getAll()
        this._updatePage()
    }

    async _updatePage()
    {
        this.working = true;
        this.page = await getPageMd(this._options!)
        this.working = false;
    }

    _download()
    {
        if (!this.page)
            return

        download(this.page, this._options!)
    }

    render()
    {
        const content = this.page
            ? html`
            <custom-textfield id="title" customstyles=${this.titleStyle.cssText} multiline quiet value="${this.page.title}"></custom-textfield>
            <custom-textfield id="preview" customstyles=${this.previewStyle.cssText} multiline value="${this.page.md}"></custom-textfield>
            <sp-field-label for="tags">Tags: </sp-field-label>
            <custom-textfield id="tags" ></custom-textfield>
            <p>${Object.keys(this.page.imgs).length || 0} images</p>
            <sp-button id="download" @click="${this._download}" enabled=${!this.working}>Download</sp-button>
`
            : html`
            <sp-progress-circle
                label="A medium representation of an unclear amount of work"
                indeterminate
            ></sp-progress-circle>
`

        return html`
        <sp-theme color="light" scale="medium">
            <div id="main">
                    ${content}
            </div>
        </sp-theme>
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