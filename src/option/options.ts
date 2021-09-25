import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators";
import '@spectrum-web-components/theme/sp-theme.js';
import '@spectrum-web-components/theme/src/themes.js';
import '@spectrum-web-components/field-label/sp-field-label.js';
import '@spectrum-web-components/textfield/sp-textfield.js';
import '@spectrum-web-components/picker/sp-picker.js';
import '@spectrum-web-components/menu/sp-menu-item.js';

import '../components/textfield';

import optionsStorage, { Options } from "./options-storage";
import capitalize from 'lodash/capitalize';

@customElement('option-main')
class OptionMain extends LitElement
{
    static styles = css`
    *{
        box-sizing: border-box;
    }

    :host, form{
        background: transparent;
    }

    .form-field{
        display: flex;
        margin-bottom: var(--spectrum-alias-body-margin-bottom);
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
        let id: string = e.target.id
        let newValue: string = e.target.value
        if (id.startsWith('picker-'))
        {
            newValue = newValue.toLowerCase()
            id = id.substring(7)
        }
        if (id.endsWith('Path'))
        {
            newValue = newValue.trim()
        }

        e.target.value = newValue

        await optionsStorage.set({ [id]: newValue })

        this.fetchOptions()

        console.log(this._options)
    }

    render()
    {
        if (!this._options) return html`...`

        return html`
        <sp-theme color=${this._options.theme} scale=${this._options.scale}>
            <form>
                <sp-field-group>
                    <div class="form-field">
                        <sp-field-label for="picker-theme">Theme:</sp-field-label>
                        <sp-picker id="picker-theme" value=${capitalize(this._options.theme)} @change=${this._optionsChanged}>
                            <sp-menu-item>Lightest</sp-menu-item>
                            <sp-menu-item>Light</sp-menu-item>
                            <sp-menu-item>Dark</sp-menu-item>
                            <sp-menu-item>Darkest</sp-menu-item>
                        </sp-picker>
                    </div>
                    <div class="form-field">
                        <sp-field-label for="picker-scale">Scale:</sp-field-label>
                        <sp-picker id="picker-scale" value=${capitalize(this._options.scale)} @change=${this._optionsChanged}>
                            <sp-menu-item>Medium</sp-menu-item>
                            <sp-menu-item>Large</sp-menu-item>
                        </sp-picker>
                    </div>
                </sp-field-group>
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