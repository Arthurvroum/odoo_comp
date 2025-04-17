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
                
                Array.from(enhanceNodes).forEach((node, index) => {
                    // Créer un field à la place de enhance_many2one
                    const fieldNode = arch.ownerDocument.createElement("field");
                    
                    // Récupérer le nom du champ depuis l'attribut name s'il existe
                    if (node.hasAttribute("name")) {
                        fieldNode.setAttribute("name", node.getAttribute("name"));
                    } else {
                        // Utiliser my_model_id comme champ par défaut si name n'est pas spécifié
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
                    
                    // Remplacer le nœud enhance_many2one par notre field
                    node.replaceWith(fieldNode);
                    console.log(`[enhance_many2one_parser] Node ${index} transformed with name=${fieldNode.getAttribute("name")} and options=${fieldNode.getAttribute("options")}`);
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