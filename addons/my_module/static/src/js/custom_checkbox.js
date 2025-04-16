/** @odoo-module **/

import { registry } from "@web/core/registry";
import { useState } from "@odoo/owl";
import { Component, xml } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";

/**
 * Composant Checkbox personnalisé avec UI améliorée et fonctionnalités additionnelles
 */
export class CustomCheckbox extends Component {
    static props = standardFieldProps;
    
    setup() {
        // Créer un état interne pour suivre les changements locaux avant sauvegarde
        this.state = useState({
            checked: Boolean(this.props.value),
            hovered: false
        });
        
        // Mettre à jour l'état interne quand les props changent
        this.props.record.addEventListener("update", () => {
            this.state.checked = Boolean(this.props.value);
        });
    }
    
    /**
     * Gestion du changement de la checkbox
     */
    onChange() {
        // Inverser l'état interne
        this.state.checked = !this.state.checked;
        
        // Mettre à jour la valeur du champ dans Odoo
        this.props.update(this.state.checked);
        
        console.log(`État de la checkbox changé à: ${this.state.checked}`);
    }
    
    /**
     * Suivi de l'état de survol pour les effets visuels
     */
    onMouseEnter() {
        this.state.hovered = true;
    }
    
    onMouseLeave() {
        this.state.hovered = false;
    }
    
    /**
     * Retourne le libellé à afficher à côté de la checkbox
     */
    get displayLabel() {
        // Utilise le libellé du champ ou une valeur par défaut
        return this.props.string || "Activer";
    }
    
    /**
     * Désactive la checkbox selon les props du composant ou l'état de l'enregistrement
     */
    get isDisabled() {
        // Vérifie si le champ est en lecture seule
        return this.props.readonly;
    }
}

// Définir le template du composant
CustomCheckbox.template = xml`
<div class="o_custom_checkbox" 
     t-on-mouseenter="onMouseEnter"
     t-on-mouseleave="onMouseLeave"
     t-att-class="{ 'checkbox-hovered': state.hovered }">
    <div class="form-check form-switch">
        <input type="checkbox" 
               class="form-check-input custom-control-input"
               t-att-checked="state.checked"
               t-att-disabled="isDisabled"
               t-on-change="onChange" />
        <label class="form-check-label" t-esc="displayLabel" />
    </div>
    <div t-if="state.checked" class="text-success small mt-1">
        <i class="fa fa-check-circle me-1" />Activé
    </div>
    <div t-else="" class="text-muted small mt-1">
        <i class="fa fa-times-circle me-1" />Désactivé
    </div>
</div>
`;

// Enregistrer le composant comme widget de champ
registry.category("fields").add("custom_checkbox", {
    component: CustomCheckbox,
    supportedTypes: ["boolean"],
    // Personnaliser la fonction isEmpty pour un affichage correct dans les vues liste/kanban
    isEmpty: (props) => props.value === false || props.value === null
});

export default CustomCheckbox;