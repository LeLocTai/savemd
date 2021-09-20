import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { getPageMd } from './markdown';

@customElement('popup-main')
class PopupMain extends LitElement
{
    static styles = css`
        :host {
            display: block;
            width: 20em;
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
    protected _md = ''

    constructor()
    {
        super()

        this._updateMd()
    }


    async _updateMd()
    {
        this._md = await getPageMd()
    }

    render()
    {
        return html`
        <h2 id="title">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eget purus eget magna efficitur
            maximus.Suspendisse iaculis dolor at tellus convallis, vel tincidunt neque consequat. Pellentesque tempus sapien
            vitae nibh vestibulum, quis posuere neque ultricies. Nullam condimentum ligula nec egestas imperdiet. Phasellus
            iaculis nulla ut eros posuere lacinia sit amet eget enim.</h2>
        <p><label for="tags">Tags: </label><input id="tags" type="text"></p>
        <p><label for="path">Path: </label><input id="path" type="text" value="Web Clips"></p>
        <p><textarea id="preview">${this._md}</textarea></p>
        <button id="download" @click="${this._updateMd}">Download</button>
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