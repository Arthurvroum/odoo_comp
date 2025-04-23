/** @odoo-module **/

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { Component, xml, useState, onWillUpdateProps, useEffect } from "@odoo/owl";
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
 * - Periodic auto-refresh of linked data
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
        // Support direct de l'attribut refreshInterval 
        "refreshInterval": { type: Number, optional: true },
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
            error: null,
            lastValue: null,
            lastRecord: null,
            lastRefreshTime: null
        });
        
        // Parse options and load data
        this._parseOptions();
        
        // Chargement initial des données
        this._loadLinkedRecordData();
        
        // Stocker des références pour détecter les changements
        this.state.lastValue = this.recordId;
        this.state.lastRecord = this.props.record;
        
        // Écouter les changements de props pour recharger les données
        onWillUpdateProps((nextProps) => {
            // Vérifier si la valeur ou le record a changé
            const nextValue = this._getRecordIdFromProps(nextProps);
            const currentValue = this.recordId;
            const recordChanged = nextProps.record !== this.props.record;
            
            console.log(`[EnhancedMany2OneWidget] Props update check - Field: ${nextProps.name}, Current ID: ${currentValue}, Next ID: ${nextValue}, Record changed: ${recordChanged}`);
            
            // Recharger si la valeur a changé ou si le record a changé (après sauvegarde)
            if (nextValue !== currentValue || recordChanged) {
                console.log(`[EnhancedMany2OneWidget] Reloading data for field ${nextProps.name} with ${nextProps["field-ref"] || (nextProps.options?.["field-ref"])}`);
                // On attend le prochain cycle pour s'assurer que les props sont à jour
                setTimeout(() => this._loadLinkedRecordData(), 0);
            }
        });
        
        // Forcer une actualisation périodique en mode édition pour gérer les cas où onWillUpdateProps ne se déclenche pas
        useEffect(() => {
            if (!this.isButtonMode) {
                const interval = setInterval(() => {
                    if (this.recordId && this.recordId !== this.state.lastValue) {
                        console.log(`[EnhancedMany2OneWidget] Detected value change during edit mode: ${this.state.lastValue} -> ${this.recordId}`);
                        this.state.lastValue = this.recordId;
                        this._loadLinkedRecordData();
                    }
                }, 1000); // Vérifier toutes les secondes
                
                return () => clearInterval(interval);
            }
        });
        
        // Rafraîchissement périodique des données - indépendant du mode (édition ou lecture)
        useEffect(() => {
            // Déterminer l'intervalle de rafraîchissement (en millisecondes)
            // Peut être configuré via options ou utilise une valeur par défaut
            const refreshInterval = this.getRefreshInterval();
            
            if (refreshInterval <= 0) {
                // Pas de rafraîchissement automatique si l'intervalle est <= 0
                return;
            }
            
            console.log(`[EnhancedMany2OneWidget] Setting up auto-refresh for ${this.props.name} every ${refreshInterval/1000} seconds`);
            
            // Créer un intervalle qui rechargera les données périodiquement
            const intervalId = setInterval(() => {
                if (this.recordId) {
                    console.log(`[EnhancedMany2OneWidget] Auto-refreshing data for ${this.props.name}`);
                    this._loadLinkedRecordData();
                    this.state.lastRefreshTime = new Date();
                }
            }, refreshInterval);
            
            // Retourner une fonction de nettoyage qui sera appelée lors de la destruction du composant
            return () => {
                console.log(`[EnhancedMany2OneWidget] Cleaning up auto-refresh for ${this.props.name}`);
                clearInterval(intervalId);
            };
        });
    }
    
    /**
     * Obtenir l'intervalle de rafraîchissement à partir des options
     * @returns {number} Intervalle en millisecondes (0 = pas de rafraîchissement)
     */
    getRefreshInterval() {
        // Par défaut: pas de rafraîchissement automatique
        let interval = 0;
        
        // Vérifier si ce champ a l'attribut refreshInterval explicitement défini
        // Si refreshInterval n'est pas défini pour ce champ, retourner 0 (pas d'actualisation)
        const hasRefreshAttribute = this.props.refreshInterval !== undefined || 
                                   (this.options && this.options.refreshInterval !== undefined);
        
        if (!hasRefreshAttribute) {
            console.log(`[EnhancedMany2OneWidget] No refreshInterval defined for ${this.props.name}, auto-refresh disabled`);
            return 0;
        }
        
        // Priorité 1: Vérifier l'attribut refreshInterval direct
        if (this.props.refreshInterval !== undefined) {
            const directInterval = parseInt(this.props.refreshInterval, 10);
            if (!isNaN(directInterval)) {
                console.log(`[EnhancedMany2OneWidget] Using direct refreshInterval attribute: ${directInterval} seconds for ${this.props.name}`);
                return directInterval * 1000; // Convertir en millisecondes
            }
        }
        
        return interval;
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
                    console.error(`[EnhancedMany2OneWidget] Failed to parse options JSON for ${this.props.name}:`, e);
                }
            } else if (typeof this.props.options === 'object') {
                this.options = { ...this.props.options };
            }
        }
        
        // Direct field-ref attribute has priority
        if (this.props['field-ref']) {
            this.options['field-ref'] = this.props['field-ref'];
        }
        
        // Direct refreshInterval attribute has priority - mais uniquement si défini explicitement
        if (this.props.refreshInterval !== undefined) {
            this.options.refreshInterval = parseInt(this.props.refreshInterval, 10);
        }
        
        // Debug - Log source component name and options
        console.log(`[EnhancedMany2OneWidget] Parsed options for ${this.props.name}:`, JSON.stringify(this.options));
    }
    
    /**
     * Obtenir le champ référencé dans field-ref
     */
    get referencedField() {
        if (this.options && this.options['field-ref']) {
            return this.options['field-ref'];
        }
        return 'name'; // Valeur par défaut si non spécifié
    }
    
    /**
     * Utilitaire pour obtenir l'ID de l'enregistrement à partir des props
     */
    _getRecordIdFromProps(props) {
        if (!props) return false;
        
        let value = null;
        
        if (props.value) {
            value = props.value;
        } else if (props.record?.data && props.name) {
            value = props.record.data[props.name];
        }
        
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
     * Load data from linked record - utilise dynamiquement le champ référencé
     */
    async _loadLinkedRecordData() {
        const recordId = this.recordId;
        const relationModel = this.relationModel;
        const fieldToFetch = this.referencedField;
        
        if (!recordId || !relationModel || this.state.loading) {
            return;
        }
        
        console.log(`[EnhancedMany2OneWidget] Loading data for ${this.props.name} - Model: ${relationModel}, ID: ${recordId}, Field: ${fieldToFetch}`);
        
        try {
            this.state.loading = true;
            
            // Toujours inclure 'name' en plus du champ spécifié pour l'affichage de secours
            const fields = ['name'];
            
            // Ajouter le champ référencé s'il n'est pas déjà inclus
            if (fieldToFetch && fieldToFetch !== 'name') {
                fields.push(fieldToFetch);
            }
            
            console.log(`[EnhancedMany2OneWidget] Fetching fields: ${fields.join(', ')}`);
            
            const result = await this.orm.read(relationModel, [recordId], fields);
            
            if (result && result.length > 0) {
                this.state.linkedRecordData = result[0];
                console.log(`[EnhancedMany2OneWidget] Loaded data for ${this.props.name}:`, this.state.linkedRecordData);
            } else {
                console.log(`[EnhancedMany2OneWidget] No data found for ${this.props.name}`);
                this.state.linkedRecordData = null;
            }
            
            // Mettre à jour la référence de la dernière valeur connue
            this.state.lastValue = recordId;
            this.state.lastRecord = this.props.record;
        } catch (error) {
            this.state.error = error;
            console.error(`[EnhancedMany2OneWidget] Error loading data for ${this.props.name}:`, error);
        } finally {
            this.state.loading = false;
        }
    }
    
    /**
     * Get the value of the referenced field
     */
    get referencedFieldValue() {
        const fieldRef = this.referencedField;
        
        if (!fieldRef) {
            return null;
        }
        
        // Get from loaded linked record data
        if (this.state.linkedRecordData && fieldRef in this.state.linkedRecordData) {
            const value = this.state.linkedRecordData[fieldRef];
            console.log(`[EnhancedMany2OneWidget] Referenced field ${fieldRef} value for ${this.props.name}:`, value);
            return value;
        }
        
        console.log(`[EnhancedMany2OneWidget] Field ${fieldRef} not found in linked data for ${this.props.name}`);
        return null;
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