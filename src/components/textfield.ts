import { Textfield } from "@spectrum-web-components/textfield";
import { customElement, property } from "lit/decorators";
import { html } from '@spectrum-web-components/base';

@customElement('custom-textfield')
class CustomTextField extends Textfield
{
    @property()
    protected customStyles?: string;

    render()
    {
        const base = super.render()

        return html`
            ${base}
            <style>${this.customStyles}</style>
        `
    }
}