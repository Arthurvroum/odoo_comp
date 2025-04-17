/** @odoo-module **/

import { registry } from "@web/core/registry";
import { patch } from "@web/core/utils/patch";
import { FormArchParser } from "@web/views/form/form_arch_parser";

// Stocker une référence à la fonction originale
const originalParse = FormArchParser.prototype.parse;

// Patching du parser pour transformer les balises <enhance_many2one> en <field>
patch(FormArchParser.prototype, {
    parse(arch, ...args) {
        // Vérifier et transformer les balises enhance_many2one avant le parsing standard
        try {
            const enhanceNodes = arch.querySelectorAll("enhance_many2one");
            if (enhanceNodes && enhanceNodes.length > 0) {
                console.log("[enhance_many2one_parser] Found enhance_many2one nodes:", enhanceNodes.length);
                
                // Afficher tous les attributs de chaque nœud avant transformation
                Array.from(enhanceNodes).forEach((node, index) => {
                    const attrs = {};
                    for (let i = 0; i < node.attributes.length; i++) {
                        const attr = node.attributes[i];
                        attrs[attr.name] = attr.value;
                    }
                    console.log(`[enhance_many2one_parser] Node ${index} original attributes:`, JSON.stringify(attrs));
                });
                
                Array.from(enhanceNodes).forEach((node, index) => {
                    // Créer un field à la place de enhance_many2one
                    const fieldNode = arch.ownerDocument.createElement("field");
                    
                    // Récupérer tous les attributs du nœud original et les copier
                    for (let i = 0; i < node.attributes.length; i++) {
                        const attr = node.attributes[i];
                        fieldNode.setAttribute(attr.name, attr.value);
                        console.log(`[enhance_many2one_parser] Copying attribute ${attr.name}=${attr.value}`);
                    }
                    
                    // Vérifier spécifiquement l'attribut name
                    const fieldName = node.getAttribute("name");
                    if (fieldName) {
                        console.log(`[enhance_many2one_parser] Setting field name to ${fieldName} for node ${index}`);
                        fieldNode.setAttribute("name", fieldName);
                    } else {
                        console.log(`[enhance_many2one_parser] No name attribute found for node ${index}, using default`);
                        fieldNode.setAttribute("name", "my_model_id");
                    }
                    
                    // Ajouter le widget enhanced_many2one
                    fieldNode.setAttribute("widget", "enhanced_many2one");
                    
                    // Transférer l'attribut field-ref via options pour garantir qu'il est correctement passé au widget
                    if (node.hasAttribute("field-ref")) {
                        const fieldRef = node.getAttribute("field-ref");
                        const options = JSON.stringify({ 'field-ref': fieldRef });
                        fieldNode.setAttribute("options", options);
                        
                        // Également conserver l'attribut direct pour compatibilité
                        fieldNode.setAttribute("field-ref", fieldRef);
                        
                        console.log(`[enhance_many2one_parser] Setting field-ref to ${fieldRef} with options=${options}`);
                    }
                    
                    // Afficher tous les attributs du nœud transformé
                    const fieldAttrs = {};
                    for (let i = 0; i < fieldNode.attributes.length; i++) {
                        const attr = fieldNode.attributes[i];
                        fieldAttrs[attr.name] = attr.value;
                    }
                    console.log(`[enhance_many2one_parser] Node ${index} final attributes:`, JSON.stringify(fieldAttrs));
                    
                    // Remplacer le nœud enhance_many2one par notre field
                    node.replaceWith(fieldNode);
                });
            }
        } catch (error) {
            console.error("[enhance_many2one_parser] Error processing enhance_many2one nodes:", error);
        }
        
        // Appeler la fonction parse originale avec le contenu modifié
        return originalParse.apply(this, [arch, ...args]);
    }
});

console.log("[enhance_many2one_parser] Custom enhance_many2one tag parser registered");

export const enhanceManyOneParser = {
    name: "enhance_many2one_parser"
};