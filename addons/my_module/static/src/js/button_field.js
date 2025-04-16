/** @odoo-module **/

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { Component, xml } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { Many2OneField } from "@web/views/fields/many2one/many2one_field";

/**
 * Button field widget that shows:
 * - A standard many2one field when in edit mode and state is draft
 * - A button that navigates to the record when in read-only mode or state is confirmed
 */
export class ButtonFieldWidget extends Component {
    static props = standardFieldProps;
    
    // Déclarer les composants utilisés dans le template
    static components = { Many2OneField };
    
    setup() {
        this.actionService = useService("action");
        console.log("ButtonField widget props:", this.props);
        
        // Check if value is in record data
        if (this.props.record?.data) {
            console.log("Record data:", this.props.record.data);
            console.log("Field in record:", this.props.record.data[this.props.name]);
            console.log("Record state:", this.props.record.data.state);
        }
    }
    
    get actualValue() {
        // Try to get value from multiple sources
        if (this.props.value) {
            return this.props.value;
        }
        
        // Try record.data[fieldname]
        if (this.props.record?.data && this.props.name && this.props.record.data[this.props.name]) {
            return this.props.record.data[this.props.name];
        }
        
        return null;
    }
    
    get displayName() {
        const value = this.actualValue;
        if (!value) return "";
        
        // Handle array format [id, name]
        if (Array.isArray(value) && value.length > 1) {
            return value[1] || "Unnamed";
        }
        
        // Handle object format
        if (typeof value === 'object' && value.display_name) {
            return value.display_name;
        }
        
        return String(value);
    }
    
    get recordId() {
        const value = this.actualValue;
        if (!value) return false;
        
        // Handle array format [id, name]
        if (Array.isArray(value) && value.length > 0) {
            return value[0];
        }
        
        // Handle object format
        if (typeof value === 'object' && value.id) {
            return value.id;
        }
        
        // Simple numeric value
        if (!isNaN(parseInt(value))) {
            return parseInt(value);
        }
        
        return false;
    }
    
    get hasValue() {
        const result = Boolean(this.recordId);
        console.log("hasValue check:", result, "recordId:", this.recordId);
        return result;
    }
    
    /**
     * Determine if the widget should be in button mode
     * Based on readonly prop AND record state
     */
    get isButtonMode() {
        // Si le record est en mode readonly, on affiche le bouton
        if (this.props.readonly) {
            return true;
        }
        
        // Si l'état est 'confirmed', on affiche aussi le bouton
        if (this.props.record?.data?.state === 'confirmed') {
            return true;
        }
        
        return false;
    }
    
    /**
     * Get the relation model (target model) for navigation
     */
    get relationModel() {
        // Try to get from props first
        if (this.props.relation) {
            console.log("Using relation from props:", this.props.relation);
            return this.props.relation;
        }
        
        // Try to determine from field definition
        if (this.props.record && this.props.record.fields && this.props.name) {
            const field = this.props.record.fields[this.props.name];
            if (field && field.relation) {
                console.log("Using relation from field definition:", field.relation);
                return field.relation;
            }
        }
        
        // Fallback to the model we know should be the target
        console.log("Using fallback relation: my_module.my_model");
        return 'my_module.my_model';
    }
    
    /**
     * Navigate to the record when clicked
     */
    onButtonClick() {
        console.log("Button clicked with recordId:", this.recordId, "relation:", this.relationModel);
        
        if (this.recordId) {
            try {
                this.actionService.doAction({
                    type: "ir.actions.act_window",
                    res_model: this.relationModel,
                    res_id: this.recordId,
                    views: [[false, "form"]],
                    target: "current"
                });
                console.log("Navigation action triggered");
            } catch (error) {
                console.error("Error during navigation:", error);
            }
        } else {
            console.warn("Cannot navigate: No recordId found");
        }
    }
}

// Use different templates based on edit mode and state
ButtonFieldWidget.template = xml`
<t>
    <t t-if="isButtonMode">
        <t t-if="hasValue">
            <button class="btn btn-primary button-field" t-on-click="onButtonClick" 
                    t-att-data-id="recordId" t-att-data-model="relationModel">
                <i class="fa fa-external-link me-1"/>
                <t t-esc="displayName"/>
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
registry.category("fields").add("button_field", {
    component: ButtonFieldWidget,
    supportedTypes: ["many2one"],
    isEmpty: (props) => !props.value
});

export default ButtonFieldWidget;