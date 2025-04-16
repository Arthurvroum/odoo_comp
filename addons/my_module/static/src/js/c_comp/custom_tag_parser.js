/** @odoo-module **/

import { registry } from "@web/core/registry";
import { patch } from "@web/core/utils/patch";
import { FormArchParser } from "@web/views/form/form_arch_parser";

// Stocker une référence à la fonction originale
const originalParse = FormArchParser.prototype.parse;

// Patching du parser pour transformer les balises <counter> en <widget>
patch(FormArchParser.prototype, {
    parse(arch, ...args) {
        // Vérifier et transformer les balises counter avant le parsing standard
        try {
            const counterNodes = arch.querySelectorAll("counter");
            console.log("Found counter nodes:", counterNodes.length);
            
            if (counterNodes && counterNodes.length > 0) {
                Array.from(counterNodes).forEach((node, index) => {
                    // Debug: Afficher les attributs bruts
                    console.log(`Counter node ${index} raw attributes:`, Array.from(node.attributes).map(attr => `${attr.name}="${attr.value}"`).join(", "));
                    
                    // Créer un widget à la place de counter
                    const widgetNode = arch.ownerDocument.createElement("widget");
                    
                    // S'assurer que le nom du widget est défini
                    widgetNode.setAttribute("name", "simple_click_counter");
                    
                    // Transférer uniquement les attributs essentiels
                    if (node.hasAttribute("initial-value")) {
                        widgetNode.setAttribute("initial-value", node.getAttribute("initial-value"));
                    }
                    
                    if (node.hasAttribute("readonly")) {
                        widgetNode.setAttribute("readonly", node.getAttribute("readonly"));
                    }
                    
                    if (node.hasAttribute("field-ref")) {
                        widgetNode.setAttribute("field-ref", node.getAttribute("field-ref"));
                    }
                    
                    // Remplacer le nœud counter par notre widget
                    node.replaceWith(widgetNode);
                    console.log(`Counter node ${index} transformed successfully`);
                });
            }
        } catch (error) {
            console.error("Error processing counter nodes:", error);
        }
        
        // Appeler la fonction parse originale avec le contenu modifié
        return originalParse.apply(this, [arch, ...args]);
    }
});

console.log("Custom counter tag parser registered");

export const customTagParser = {
    name: "custom_tag_parser"
};