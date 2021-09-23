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
import '@spectrum-web-components/switch/sp-switch.js';
import '@spectrum-web-components/status-light/sp-status-light.js';

import '../components/textarea';

import { download } from './download';
import { getCurrentPage, Page } from './page';
import isEqual from 'lodash/isEqual';

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

        #title{
            --spectrum-textfield-text-size: 1.1em;
        }

        #main {
            padding: 16px;
            background: var(--spectrum-global-color-gray-100);
            display: flex;
            flex-direction: column;
            height: 600px;
        }

        custom-textfield {
            width: 100%;
        }

        #preview {
            margin-top: .5em;
            --spectrum-textfield-text-size: .85em;
            flex: 1;
        }

        sp-status-light {
            display: inline-flex;
            --spectrum-statuslight-info-text-gap: 2px;
            --spectrum-statuslight-info-height: 0;
            --spectrum-statuslight-info-padding-bottom: 0;
            --spectrum-statuslight-info-padding-top: 0;
        }

        #download{
            padding: .5em;
            width: 100%;
            /* max-height */
        }
    `;

    static titleStyle = css`
        .input, #sizer {
            font-weight: bold;
        }
    `;

    static previewStyle = css`
        :host([multiline]) textarea.input {
            width: 100% !important;
            height: 100% !important;
        }
    `;

    @state({
        hasChanged: (next, prev) => isEqual(next, prev)
    })
    protected page?: Page

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
        this.page = await getCurrentPage(this._options!)
        this.working = false;
    }

    _titleChanged(e)
    {
        if (this.page!.title !== e.target.value)
        {
            this.page!.title = e.target.value
            this.page = this.page!.recalculate(this._options!)
        }
    }

    _mdChanged(e)
    {
        this.page!.md = e.target.value
    }

    _toggleSimplify(e)
    {
        this.page!.simplify = e.target.checked;
        this.page = this.page!.recalculate(this._options!)
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
            <custom-textfield
                id="title"
                customstyles=${PopupMain.titleStyle.cssText}
                multiline grows
                value=${this.page.title}
                @change=${this._titleChanged}
            ></custom-textfield>
            <custom-textfield
                id="preview"
                customstyles=${PopupMain.previewStyle.cssText}
                multiline
                value="${this.page.md}"
                @input=${this._mdChanged}
            ></custom-textfield>
            <sp-switch  ?checked=${this.page.simplify} @change=${this._toggleSimplify}>
                Simplify
                <sp-status-light size="m" variant=${this.page.shouldSimplify ? 'positive' : 'negative'}></sp-status-light>
            </sp-switch>

            <p>${Object.keys(this.page.imgs).length || 0} images</p>
            <sp-button
                id="download"
                @click="${this._download}"
                enabled=${!this.working}>
                Download
            </sp-button>
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