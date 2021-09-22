import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators";
import '@spectrum-web-components/theme/sp-theme.js';
import '@spectrum-web-components/theme/theme-lightest.js';
import '@spectrum-web-components/theme/scale-medium.js';
import '@spectrum-web-components/field-label/sp-field-label.js';
import '@spectrum-web-components/textfield/sp-textfield.js';

import '../components/textarea';

import optionsStorage, { Options } from "./options-storage";
import { ensureTrailingSlash } from "../utils";

@customElement('option-main')
class OptionMain extends LitElement
{
    static styles = css`
    *{
        box-sizing: border-box;
    }

    :host{
        background: var(--spectrum-global-color-gray-100);
    }

    form{
        margin-top: 4px;
    }

    .form-field{
        display: flex;
        margin-top: 1em;
    }

    sp-field-label{
        width: 16ch;
    }

    .form-field custom-textfield{
        flex: 1;
    }
    `

    static frontMatterStyle = css`
        #sizer {
            white-space: pre;
        }
    `;

    @state()
    protected _options?: Options;

    constructor()
    {
        super()
        this.fetchOptions()
    }

    async fetchOptions()
    {
        this._options = await optionsStorage.getAll()
    }

    async _optionsChanged(e)
    {
        const id: string = e.target.id
        let newValue: string = e.target.value
        if (id.endsWith('Path'))
        {
            newValue = newValue.trim()
            newValue = ensureTrailingSlash(newValue)
        }

        e.target.value = newValue

        await optionsStorage.set({ [id]: newValue })
    }

    render()
    {
        if (!this._options) return html`...`

        return html`
        <sp-theme color="lightest" scale="medium">
            <form>
                <div class="form-field">
                    <sp-field-label side-aligned="start" for="mdPath">Markdown path</sp-field-label>
                    <custom-textfield id="mdPath" value=${this._options.mdPath} @change=${this._optionsChanged}></custom-textfield>
                </div>
                <div class="form-field">
                    <sp-field-label side-aligned="start" for="imgPath">Images path</sp-field-label>
                    <custom-textfield id="imgPath" value=${this._options.imgPath} @change=${this._optionsChanged}></custom-textfield>
                </div>
                <div class="form-field">
                    <sp-field-label for="frontMatter">Images path</sp-field-label>
                    <custom-textfield id="frontMatter" customstyles=${OptionMain.frontMatterStyle.cssText} multiline grows .value=${this._options.frontMatter} @change=${this._optionsChanged}></custom-textfield>
                </div>
            </form>
        </sp-theme>
    `
    }
}

declare global
{
    interface HTMLElementTagNameMap
    {
        'option-main': OptionMain;
    }
}