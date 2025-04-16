/** @odoo-module **/

import { Component, xml, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { useRecordObserver } from "@web/model/relational_model/utils";

/**
 * Composant OWL simple avec juste un compteur
 */
export class SimpleClickCounter extends Component {
    static template = xml`
        <div class="o_simple_click_counter" t-on-click="increment">
            <span class="counter-value"><t t-esc="state.value"/></span>
            <span t-if="state.displayName" class="counter-name"><t t-esc="state.displayName"/></span>
        </div>
    `;

    static props = {
        initialValue: { type: Number, optional: true },
        readonly: { type: Boolean, optional: true },
        fieldRef: { type: String, optional: true },
        record: { type: Object, optional: true },
    };

    static defaultProps = {
        initialValue: 1,
        readonly: false
    };

    setup() {
        // Utilisation du service de notification d'Odoo
        this.notification = useService("notification");
        
        // Initialiser avec la valeur initiale
        const initialValue = this.props.initialValue || 1;
        let displayName = "";
        
        // Récupérer le nom à partir du fieldRef si disponible
        if (this.props.fieldRef && this.props.record && this.props.record.data) {
            displayName = this.props.record.data[this.props.fieldRef] || "";
        }
        
        this.state = useState({ 
            value: initialValue,
            displayName: displayName 
        });
        
        console.log("SimpleClickCounter setup with initialValue:", initialValue, "and fieldRef:", this.props.fieldRef);
        
        // Observer les changements du modèle si fieldRef est spécifié
        if (this.props.fieldRef && this.props.record) {
            useRecordObserver((record) => {
                // Mettre à jour le nom affiché uniquement si fieldRef est spécifié
                if (this.props.fieldRef && record.data && record.data[this.props.fieldRef] !== undefined) {
                    const newDisplayName = record.data[this.props.fieldRef];
                    
                    if (this.state.displayName !== newDisplayName) {
                        this.state.displayName = newDisplayName;
                        console.log("Counter name updated from fieldRef:", this.state.displayName);
                    }
                }
            });
        }
    }

    increment() {
        if (!this.props.readonly) {
            this.state.value++;
            console.log("Counter value incremented to:", this.state.value);
            
            const nameText = this.state.displayName ? ` ${this.state.displayName}` : '';
            this.notification.add(
                `Compteur incrémenté à ${this.state.value}${nameText}`, 
                { type: "info" }
            );
        }
    }
}

// Enregistrer dans le registre des widgets de vue
registry.category("view_widgets").add("simple_click_counter", {
    component: SimpleClickCounter,
    extractProps: (widgetInfo, params) => {
        const props = {};
        
        if (widgetInfo.attrs.initialValue) {
            props.initialValue = parseInt(widgetInfo.attrs.initialValue, 10);
        } else if (widgetInfo.attrs["initial-value"]) {
            props.initialValue = parseInt(widgetInfo.attrs["initial-value"], 10);
        }
        
        if (widgetInfo.attrs.readonly === "true") {
            props.readonly = true;
        } else if (widgetInfo.attrs.readonly === "false") {
            props.readonly = false;
        }
        
        // Récupérer uniquement field-ref
        if (widgetInfo.attrs["field-ref"]) {
            props.fieldRef = widgetInfo.attrs["field-ref"];
        }
        
        // Transmettre le record pour accéder aux données du modèle
        if (params && params.record) {
            props.record = params.record;
        }
        
        console.log("Extracted props for counter widget:", props);
        return props;
    }
});

console.log("SimpleClickCounter widget registered successfully");

export default SimpleClickCounter;