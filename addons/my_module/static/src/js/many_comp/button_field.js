/** @odoo-module **/

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { Component, xml } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { Many2OneField } from "@web/views/fields/many2one/many2one_field";

/**
 * Enhanced Many2One Field widget that combines button_field and many2one_widget functionalities:
 * - A standard many2one field when in edit mode and state is draft
 * - A navigation button or fancy badge for readonly mode or when state is confirmed
 */
export class EnhancedMany2OneWidget extends Component {
    static props = standardFieldProps;
    static components = { Many2OneField };
    
    setup() {
        this.actionService = useService("action");
        this.notification = useService("notification");
        
        // Debug pour voir toutes les props passées au composant
        console.log("[EnhancedMany2OneWidget] Props:", this.props);
        console.log("[EnhancedMany2OneWidget] Options:", this.props.options);
        console.log("[EnhancedMany2OneWidget] Record:", this.props.record?.data);
    }
    
    get actualValue() {
        if (this.props.value) {
            return this.props.value;
        }
        
        if (this.props.record?.data && this.props.name && this.props.record.data[this.props.name]) {
            return this.props.record.data[this.props.name];
        }
        
        return null;
    }
    
    get displayName() {
        const value = this.actualValue;
        if (!value) return "";
        
        if (Array.isArray(value) && value.length > 1) {
            return value[1] || "Unnamed";
        }
        
        if (typeof value === 'object' && value.display_name) {
            return value.display_name;
        }
        
        return String(value);
    }
    
    get recordId() {
        const value = this.actualValue;
        if (!value) return false;
        
        if (Array.isArray(value) && value.length > 0) {
            return value[0];
        }
        
        if (typeof value === 'object' && value.id) {
            return value.id;
        }
        
        if (!isNaN(parseInt(value))) {
            return parseInt(value);
        }
        
        return false;
    }
    
    get hasValue() {
        return Boolean(this.recordId);
    }
    
    /**
     * Determine if the widget should be in button/badge mode
     */
    get isButtonMode() {
        if (this.props.readonly) {
            return true;
        }
        
        if (this.props.record?.data?.state === 'confirmed') {
            return true;
        }
        
        return false;
    }
    
    /**
     * Get the relation model (target model) for navigation
     */
    get relationModel() {
        if (this.props.relation) {
            return this.props.relation;
        }
        
        if (this.props.record?.fields?.[this.props.name]?.relation) {
            return this.props.record.fields[this.props.name].relation;
        }
        
        return 'my_module.my_model';
    }
    
    /**
     * Get a user-friendly model name from the technical name
     */
    get modelDisplayName() {
        const model = this.relationModel;
        if (!model) return "";
        
        // Convertir le nom technique en nom convivial
        // Ex: 'res.partner' devient 'Partenaire'
        const parts = model.split('.');
        if (parts.length > 0) {
            const lastPart = parts[parts.length - 1];
            // Mettre une majuscule et remplacer les underscores par des espaces
            return lastPart.charAt(0).toUpperCase() + 
                   lastPart.slice(1).replace(/_/g, ' ');
        }
        
        return model;
    }
    
    /**
     * Récupérer la valeur du champ référencé par field-ref si disponible
     */
    get referencedFieldValue() {
        // Récupérer field-ref depuis différents endroits possibles
        let fieldRef = null;
        
        // 1. Vérifier dans les options (format JSON dans l'attribut options)
        if (this.props.options && this.props.options['field-ref']) {
            fieldRef = this.props.options['field-ref'];
            console.log("[EnhancedMany2OneWidget] Found field-ref in options:", fieldRef);
        }
        // 2. Vérifier dans les props directes
        else if (this.props['field-ref']) {
            fieldRef = this.props['field-ref'];
            console.log("[EnhancedMany2OneWidget] Found field-ref in props:", fieldRef);
        }
        // 3. Vérifier dans les attributs
        else if (this.props.attrs && this.props.attrs['field-ref']) {
            fieldRef = this.props.attrs['field-ref'];
            console.log("[EnhancedMany2OneWidget] Found field-ref in attrs:", fieldRef);
        }
        // 4. Vérifier fieldRef en camelCase
        else if (this.props.fieldRef) {
            fieldRef = this.props.fieldRef;
            console.log("[EnhancedMany2OneWidget] Found fieldRef in props:", fieldRef);
        }
        
        // Si nous avons un fieldRef et un record
        if (fieldRef && this.props.record && this.props.record.data) {
            console.log(`[EnhancedMany2OneWidget] Looking for field ${fieldRef} in record:`, this.props.record.data);
            const value = this.props.record.data[fieldRef];
            console.log(`[EnhancedMany2OneWidget] Value for field ${fieldRef}:`, value);
            return value;
        }
        
        console.log("[EnhancedMany2OneWidget] No referenced field found");
        return null;
    }
    
    /**
     * Récupérer le nom alternatif à afficher lors du survol
     */
    get alternateDisplayName() {
        // Essayer d'utiliser d'abord la valeur du champ référencé
        const refValue = this.referencedFieldValue;
        console.log("[EnhancedMany2OneWidget] Referenced field value for display:", refValue);
        
        if (refValue !== null && refValue !== undefined) {
            return String(refValue);
        }
        
        // Sinon utiliser le nom du modèle
        return this.displayName;
    }
    
    /**
     * Navigate to the record when clicked
     */
    onButtonClick() {
        if (this.recordId) {
            const target = this.openTarget;
            console.log(`[EnhancedMany2OneWidget] Opening record ${this.recordId} of model ${this.relationModel} with target ${target}`);
            
            this.actionService.doAction({
                type: "ir.actions.act_window",
                res_model: this.relationModel,
                res_id: this.recordId,
                views: [[false, "form"]],
                target: target
            });
            
            // Notification lorsqu'on clique sur le bouton
            this.notification.add(
                `Ouverture de ${this.alternateDisplayName}`, 
                { type: "info" }
            );
        } else {
            console.log("[EnhancedMany2OneWidget] Cannot open: no recordId");
        }
    }
}

EnhancedMany2OneWidget.template = xml`
<t>
    <t t-if="isButtonMode">
        <t t-if="hasValue">
            <button class="button-57" t-on-click="onButtonClick" 
                    t-att-data-id="recordId" t-att-data-model="relationModel">
                <span class="text">Détail</span>
                <span><t t-esc="displayName"/></span>
            </button>
        </t>
        <t t-else="">
            <span class="o_field_empty">Empty</span>
        </t>
    </t>
    <t t-else="">
        <!-- Use standard Many2One field in edit mode -->
        <Many2OneField t-props="props"/>
    </t>
</t>
`;

// Register with support information
registry.category("fields").add("enhanced_many2one", {
    component: EnhancedMany2OneWidget,
    supportedTypes: ["many2one"],
    isEmpty: (props) => !props.value
});

export default EnhancedMany2OneWidget;