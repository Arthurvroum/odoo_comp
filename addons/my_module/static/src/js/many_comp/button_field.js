/** @odoo-module **/

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { Component, xml, useState } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { Many2OneField } from "@web/views/fields/many2one/many2one_field";

/**
 * Enhanced Many2One Field widget with stylized button for navigation
 * 
 * Features:
 * - Standard many2one field in edit mode
 * - Fancy button in readonly mode with hover animation
 * - Uses 'field-ref' to display specific fields from linked record
 * - Async loading of linked record data
 */
export class EnhancedMany2OneWidget extends Component {
    // Définition étendue des props pour accepter toutes les propriétés transmises par Odoo
    static props = {
        // Props standard du champ
        ...standardFieldProps,
        // Props supplémentaires utilisées par Odoo mais non définies dans standardFieldProps
        widget: { type: String, optional: true },
        field: { type: Object, optional: true },
        "field-ref": { type: String, optional: true },
        // Prop générique pour accepter d'autres propriétés non listées
        "*": { type: "*" }
    };
    
    static components = { Many2OneField };
    
    setup() {
        // Services
        this.actionService = useService("action");
        this.notification = useService("notification");
        this.orm = useService("orm");
        
        // State management
        this.state = useState({
            linkedRecordData: null,
            loading: false,
            error: null
        });
        
        // Parse options and load data
        this._parseOptions();
        this._loadLinkedRecordData();
    }
    
    /**
     * Parse options from various sources
     */
    _parseOptions() {
        this.options = {};
        
        // Parse from JSON string or object
        if (this.props.options) {
            if (typeof this.props.options === 'string') {
                try {
                    this.options = JSON.parse(this.props.options);
                } catch (e) {
                    console.error("[EnhancedMany2OneWidget] Failed to parse options JSON");
                }
            } else if (typeof this.props.options === 'object') {
                this.options = this.props.options;
            }
        }
        
        // Direct field-ref attribute has priority
        if (this.props['field-ref']) {
            this.options['field-ref'] = this.props['field-ref'];
        }
    }
    
    /**
     * Load data from linked record via ORM service
     */
    async _loadLinkedRecordData() {
        const recordId = this.recordId;
        const relationModel = this.relationModel;
        
        if (!recordId || !relationModel || this.state.loading) {
            return;
        }
        
        try {
            this.state.loading = true;
            
            // Fields to fetch from linked record
            const fields = ['name', 'description'];
            const result = await this.orm.read(relationModel, [recordId], fields);
            
            if (result && result.length > 0) {
                this.state.linkedRecordData = result[0];
            }
        } catch (error) {
            this.state.error = error;
            console.error("[EnhancedMany2OneWidget] Error loading data:", error);
        } finally {
            this.state.loading = false;
        }
    }
    
    /**
     * Get the currently selected value
     */
    get actualValue() {
        if (this.props.value) {
            return this.props.value;
        }
        
        if (this.props.record?.data && this.props.name) {
            return this.props.record.data[this.props.name];
        }
        
        return null;
    }
    
    /**
     * Extract ID from the value
     */
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
    
    /**
     * Get display name of selected record
     */
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
    
    /**
     * Get the value of the referenced field
     */
    get referencedFieldValue() {
        const fieldRef = this.options && this.options['field-ref'];
        
        if (!fieldRef) {
            return null;
        }
        
        // Get from loaded linked record data
        if (this.state.linkedRecordData && fieldRef in this.state.linkedRecordData) {
            return this.state.linkedRecordData[fieldRef];
        }
        
        return null;
    }
    
    /**
     * Get the text to display on hover
     */
    get alternateDisplayName() {
        if (this.state.loading) {
            return "Chargement...";
        }
        
        if (this.state.error) {
            return "Erreur de chargement";
        }
        
        const refValue = this.referencedFieldValue;
        if (refValue !== null && refValue !== undefined) {
            return String(refValue);
        }
        
        return this.displayName;
    }
    
    /**
     * Check if the widget has a value
     */
    get hasValue() {
        return Boolean(this.recordId);
    }
    
    /**
     * Determine if widget should be in button mode
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
     * Get the relation model
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
     * Handle button click
     */
    onButtonClick() {
        if (this.recordId) {
            const target = (this.options && this.options.open_target) || "current";
            
            this.actionService.doAction({
                type: "ir.actions.act_window",
                res_model: this.relationModel,
                res_id: this.recordId,
                views: [[false, "form"]],
                target: target
            });
            
            this.notification.add(
                `Ouverture de ${this.alternateDisplayName}`, 
                { type: "info" }
            );
        }
    }
}

// Template for the widget
EnhancedMany2OneWidget.template = xml`
<t>
    <t t-if="isButtonMode">
        <t t-if="hasValue">
            <button class="button-57" t-on-click="onButtonClick" 
                    t-att-data-id="recordId" t-att-data-model="relationModel">
                <span class="text">Détail</span>
                <span><t t-esc="alternateDisplayName"/></span>
            </button>
        </t>
        <t t-else="">
            <span class="o_field_empty">Non défini</span>
        </t>
    </t>
    <t t-else="">
        <Many2OneField t-props="props"/>
    </t>
</t>
`;

// Register the field widget
registry.category("fields").add("enhanced_many2one", {
    component: EnhancedMany2OneWidget,
    supportedTypes: ["many2one"],
    isEmpty: (props) => !props.value,
    extractProps: (fieldInfo, dynamicInfo) => {
        const props = {
            ...fieldInfo,
            ...dynamicInfo,
        };
        
        // Extract options from JSON
        if (fieldInfo.attrs && fieldInfo.attrs.options) {
            try {
                props.options = JSON.parse(fieldInfo.attrs.options);
            } catch (e) {
                props.options = {};
            }
        }
        
        // Copy field-ref attribute directly
        if (fieldInfo.attrs && fieldInfo.attrs["field-ref"]) {
            props["field-ref"] = fieldInfo.attrs["field-ref"];
            
            if (!props.options) props.options = {};
            props.options["field-ref"] = fieldInfo.attrs["field-ref"];
        }
        
        return props;
    }
});

// Alias for backward compatibility
registry.category("fields").add("button_field", {
    component: EnhancedMany2OneWidget,
    supportedTypes: ["many2one"],
    isEmpty: (props) => !props.value,
    extractProps: registry.category("fields").get("enhanced_many2one").extractProps
});

export default EnhancedMany2OneWidget;