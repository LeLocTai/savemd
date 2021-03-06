import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import optionsStorage, { Options } from '../option/options-storage';

import '@spectrum-web-components/theme/sp-theme.js';
import '@spectrum-web-components/theme/src/themes.js';
import '@spectrum-web-components/field-label/sp-field-label.js';
import '@spectrum-web-components/textfield/sp-textfield.js';
import '@spectrum-web-components/button/sp-button.js';
import '@spectrum-web-components/progress-circle/sp-progress-circle.js';
import '@spectrum-web-components/switch/sp-switch.js';
import '@spectrum-web-components/status-light/sp-status-light.js';
import '@spectrum-web-components/illustrated-message/sp-illustrated-message.js';

import '../components/textfield';

import { download } from './download';
import { getCurrentPage, Page } from './page';
import isEqual from 'lodash/isEqual';
import { debounce } from 'lodash';

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
            padding: var(--spectrum-alias-item-padding-l);
            background: var(--spectrum-global-color-gray-100);
            display: flex;
            flex-direction: column;
            height: 600px;
        }

        h1{
            /* color: var(--spectrum-alias-heading-text-color); */
            color: var(--spectrum-alias-text-color-disabled);
            font-size: var(--spectrum-alias-heading-m-text-size);
            text-align: center;
            margin-top: 0;
            margin-bottom: var(--spectrum-alias-heading-margin-bottom);
        }

        #title{
            --spectrum-textfield-text-size: var(--spectrum-alias-heading-xxs-text-size);
            margin-bottom: var(--spectrum-alias-heading-margin-bottom);
        }

        custom-textfield {
            width: 100%;
        }

        #preview {
            --spectrum-textfield-text-size: var(--spectrum-alias-item-text-size-s);
            flex: 1;
        }

        sp-status-light {
            display: inline-flex;
            --spectrum-statuslight-info-text-gap: 2px;
            --spectrum-statuslight-info-height: 0;
            --spectrum-statuslight-info-padding-bottom: 0;
            --spectrum-statuslight-info-padding-top: 0;
            --spectrum-statuslight-info-dot-resolved-margin-top: 0;
        }

        #info {
            color: var(--spectrum-alias-label-text-color);
            font-size: var(--spectrum-alias-item-text-size-m);
        }
    `;

    static titleStyle = css`
        .input, #sizer {
            font-weight: bold;
        }
    `;

    static previewStyle = css`
        #textfield {
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

    async _titleChanged(e)
    {
        if (this.page!.title !== e.target.value)
        {
            await this.updateTitleDebounced(e.target.value)
        }
    }

    updateTitleDebounced = debounce(this.updateTitle, 250)
    async updateTitle(newTitle: string)
    {
        this.page!.title = newTitle
        this.working = true;
        await this.page!.recalculate(this._options!)
        this.working = false;
    }

    _mdChanged(e)
    {
        this.page!.md = e.target.value
    }

    async _toggleSimplify(e)
    {
        this.page!.simplify = e.target.checked;
        this.working = true;
        await this.page!.recalculate(this._options!)
        this.working = false;
    }

    _download()
    {
        if (!this.page)
            return

        if (this.working)
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
                @input=${this._titleChanged}
            ></custom-textfield>
            <custom-textfield
                id="preview"
                customstyles=${PopupMain.previewStyle.cssText}
                multiline
                value="${this.page.md}"
                @input=${this._mdChanged}
                ?disabled=${this.working}
            ></custom-textfield>
            <div id="toggles">
                <sp-switch  ?checked=${this.page.simplify} @change=${this._toggleSimplify}>
                    Simplify
                    <sp-status-light size="m" variant=${this.page.shouldSimplify ? 'positive' : 'negative'}></sp-status-light>
                </sp-switch>
            </div>

            <p id="info">${Object.keys(this.page.imgs).length || 0} images</p>
            <sp-button
                id="download"
                @click="${this._download}"
                ?disabled=${this.working}
            >
                Download
            </sp-button>
`
            : html`
                <sp-illustrated-message
                    description="Processing..."
                >
                    <sp-progress-circle indeterminate ></sp-progress-circle>
                </sp-illustrated-message>
`

        return html`
        <sp-theme color=${this._options?.theme || 'light'} scale=${this._options?.scale || 'medium'}>
            <div id="main">
                <h1>Save as Markdown</h1>
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