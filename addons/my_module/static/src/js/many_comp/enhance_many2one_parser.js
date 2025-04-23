/** @odoo-module **/

import { registry } from "@web/core/registry";
import { patch } from "@web/core/utils/patch";
import { FormArchParser } from "@web/views/form/form_arch_parser";

// Stocker une référence à la fonction originale
const originalParse = FormArchParser.prototype.parse;

/**
 * Fusionne deux objets d'options, en gérant correctement les formats JSON
 * @param {string|object} originalOptions - Les options originales (peut être une chaîne JSON ou un objet)
 * @param {object} newOptions - Les nouvelles options à ajouter
 * @returns {object} - L'objet fusionné
 */
function mergeOptions(originalOptions, newOptions) {
    let result = {};
    
    // Traiter les options originales
    if (typeof originalOptions === 'string') {
        try {
            result = JSON.parse(originalOptions);
        } catch (e) {
            console.warn("[enhance_many2one_parser] Erreur parsing JSON options:", originalOptions);
            // Si le JSON est invalide, essayer de le corriger - gestion basique
            if (originalOptions.includes('refreshInterval')) {
                try {
                    // Remplacer les simples quotes par des doubles quotes
                    const fixedJson = originalOptions.replace(/'/g, '"');
                    result = JSON.parse(fixedJson);
                } catch (e2) {
                    console.warn("[enhance_many2one_parser] Impossible de corriger le JSON:", e2);
                }
            }
        }
    } else if (originalOptions && typeof originalOptions === 'object') {
        result = { ...originalOptions };
    }
    
    // Ajouter les nouvelles options
    if (newOptions && typeof newOptions === 'object') {
        result = { ...result, ...newOptions };
    }
    
    return result;
}

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
                    
                    // Récupérer les options existantes s'il y en a
                    let originalOptions = node.getAttribute("options");
                    let mergedOptions = originalOptions ? mergeOptions(originalOptions, {}) : {};
                    
                    // Récupérer tous les attributs du nœud original et les copier
                    // On ne copie pas les attributs spéciaux automatiquement
                    for (let i = 0; i < node.attributes.length; i++) {
                        const attr = node.attributes[i];
                        const attrName = attr.name;
                        const attrValue = attr.value;
                        
                        // Ne pas copier refreshInterval pour les nodes qui ne l'ont pas explicitement
                        if (attrName !== 'refreshInterval' && attrName !== 'field-ref') {
                            fieldNode.setAttribute(attrName, attrValue);
                            console.log(`[enhance_many2one_parser] Copying attribute ${attrName}=${attrValue}`);
                        }
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
                    
                    // Traiter spécifiquement l'attribut field-ref
                    if (node.hasAttribute("field-ref")) {
                        const fieldRef = node.getAttribute("field-ref");
                        mergedOptions["field-ref"] = fieldRef;
                        // Ne plus ajouter l'attribut direct pour éviter les confusions
                    }
                    
                    // Traiter spécifiquement l'attribut refreshInterval
                    if (node.hasAttribute("refreshInterval")) {
                        const refreshInterval = node.getAttribute("refreshInterval");
                        try {
                            mergedOptions["refreshInterval"] = parseInt(refreshInterval, 10);
                            // Ajouter refreshInterval directement sur le nœud (pour debug)
                            fieldNode.setAttribute("refreshInterval", refreshInterval);
                            console.log(`[enhance_many2one_parser] Node ${index}: Adding refreshInterval=${refreshInterval}`);
                        } catch (e) {
                            console.error(`[enhance_many2one_parser] Invalid refreshInterval value: ${refreshInterval}`);
                        }
                    } else {
                        // S'assurer qu'il n'y a pas de refreshInterval pour ce nœud
                        delete mergedOptions.refreshInterval;
                        console.log(`[enhance_many2one_parser] Node ${index}: No refreshInterval defined`);
                    }
                    
                    // Définir les options fusionnées
                    if (Object.keys(mergedOptions).length > 0) {
                        const optionsStr = JSON.stringify(mergedOptions);
                        fieldNode.setAttribute("options", optionsStr);
                        console.log(`[enhance_many2one_parser] Node ${index} options: ${optionsStr}`);
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

export default {
    name: "enhance_many2one_parser",
    priority: 30,
    condition: arch => {
        return arch.querySelector("enhance_many2one") !== null;
    },
};