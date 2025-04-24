/** @odoo-module **/

import { registry } from "@web/core/registry";
import { patch } from "@web/core/utils/patch";
import { FormArchParser } from "@web/views/form/form_arch_parser";

/**
 * Parseur personnalisé pour la balise <counter>
 * Transforme les balises counter en simples div avec des attributs data-*
 */

console.log("Custom counter tag parser registered");

// Stocker une référence à la fonction originale
const originalParse = FormArchParser.prototype.parse;

// Patching du parser pour transformer les balises <counter> en <div>
patch(FormArchParser.prototype, {
    parse(arch, ...args) {
        // Vérifier et transformer les balises counter avant le parsing standard
        try {
            const counterNodes = arch.querySelectorAll("counter");
            console.log("Found counter nodes:", counterNodes ? counterNodes.length : 0, counterNodes.length > 0 ? 2 : 0);
            
            if (counterNodes && counterNodes.length > 0) {
                Array.from(counterNodes).forEach(node => {
                    // Créer un div à la place de counter
                    const divNode = arch.ownerDocument.createElement("div");
                    
                    // Ajouter la classe pour le style
                    divNode.setAttribute("class", "simple-click-counter");
                    
                    // Copier les attributs en tant que data-*
                    for (let i = 0; i < node.attributes.length; i++) {
                        const attr = node.attributes[i];
                        divNode.setAttribute("data-" + attr.name, attr.value);
                    }
                    
                    // Ajouter un attribut avec le nombre de clics initial (0)
                    if (!divNode.hasAttribute("data-count")) {
                        divNode.setAttribute("data-count", "0");
                    }
                    
                    // Remplacer le nœud counter par notre div
                    node.replaceWith(divNode);
                });
            }
        } catch (error) {
            console.error("Error processing counter nodes:", error);
        }
        
        // Appeler la fonction parse originale avec le contenu modifié
        return originalParse.apply(this, [arch, ...args]);
    }
});

// Initialiser les onglets de la vue formulaire lorsque le DOM est prêt
document.addEventListener('DOMContentLoaded', function() {
    // On déclenche une première initialisation
    initTabsWithRetry();

    // On surveillera également les changements dans le DOM
    // pour capturer les formulaires chargés dynamiquement
    const observer = new MutationObserver(function(mutations) {
        initTabsWithRetry();
    });

    // Observer le contenu principal d'Odoo
    const observeTarget = document.querySelector('.o_content') || document.body;
    if (observeTarget) {
        observer.observe(observeTarget, { 
            childList: true, 
            subtree: true 
        });
    }
});

/**
 * Initialise les onglets avec tentatives répétées
 */
function initTabsWithRetry(retries = 5) {
    // Check if tabs are already initialized
    const alreadyInitialized = document.querySelector('.o_form_tabs_initialized');
    if (alreadyInitialized) {
        console.log("Onglets déjà initialisés");
        return;
    }
    
    // Tenter d'initialiser les onglets
    const initialized = initFormTabs();
    
    // Si l'initialisation a échoué et qu'il reste des tentatives
    if (!initialized && retries > 0) {
        console.log("Éléments d'onglets non trouvés, nouvelle tentative dans 1s");
        
        // Réessayer après un délai
        setTimeout(() => {
            // Debugger les éléments manquants
            const tab_chat = document.querySelector('.tab-chat');
            const tab_docs = document.querySelector('.tab-docs');
            const chatter = document.querySelector('.o_mail_chatter');
            const docs_content = document.querySelector('.o_attachment_preview');
            
            console.log("tab_chat:", tab_chat);
            console.log("tab_docs:", tab_docs);
            console.log("chatter:", chatter);
            console.log("docs_content:", docs_content);
            
            initTabsWithRetry(retries - 1);
        }, 1000);
    }
}

/**
 * Initialise les onglets de la vue formulaire
 * @returns {boolean} True si l'initialisation a réussi, false sinon
 */
function initFormTabs() {
    // Trouver les éléments nécessaires
    const tabChat = document.querySelector('.tab-chat');
    const tabDocs = document.querySelector('.tab-docs');
    const chatter = document.querySelector('.o_mail_chatter');
    const docsContent = document.querySelector('.o_attachment_preview');
    
    // Vérifier que tous les éléments sont présents
    if (!tabChat || !tabDocs || !chatter || !docsContent) {
        console.log("Éléments d'onglets trouvés, initialisation...");
        return false;
    }
    
    console.log("Initialisation des onglets");
    
    // Marquer comme initialisé
    document.body.classList.add('o_form_tabs_initialized');
    
    // Fonction pour changer d'onglet
    function switchTab(tabName) {
        console.log("Changement d'onglet vers:", tabName);
        
        // Masquer tous les contenus et désactiver tous les onglets
        chatter.style.display = 'none';
        docsContent.style.display = 'none';
        tabChat.classList.remove('active');
        tabDocs.classList.remove('active');
        
        // Afficher le contenu sélectionné et activer l'onglet correspondant
        if (tabName === 'chat') {
            chatter.style.display = 'block';
            tabChat.classList.add('active');
        } else if (tabName === 'docs') {
            docsContent.style.display = 'block';
            tabDocs.classList.add('active');
        }
    }
    
    // Ajouter les gestionnaires d'événements sur les onglets
    tabChat.addEventListener('click', function() {
        switchTab('chat');
    });
    
    tabDocs.addEventListener('click', function() {
        console.log("Clic sur l'onglet documents");
        switchTab('docs');
        
        // Vérifier si nous sommes sur une fiche d'achat et récupérer l'ID
        const currentUrl = window.location.href;
        console.log("URL actuelle:", currentUrl);
        
        // Utiliser l'URL pour extraire l'ID du document
        let docId = null;
        
        // Méthode 1: Extraire depuis les paramètres d'URL hash
        if (currentUrl.includes('#')) {
            const hashParts = currentUrl.split('#')[1].split('&');
            for (const part of hashParts) {
                if (part.startsWith('id=')) {
                    docId = part.split('=')[1];
                    console.log("ID trouvé via hash params:", docId);
                    break;
                }
            }
        }
        
        // Si on n'a pas trouvé l'ID, essayer d'autres méthodes
        if (!docId) {
            // Méthode 2: Rechercher dans le DOM 
            const activeForm = document.querySelector('.o_form_view.o_form_editable, .o_form_view.o_form_readonly');
            if (activeForm && activeForm.dataset.resId) {
                docId = activeForm.dataset.resId;
                console.log("ID trouvé via data-res-id:", docId);
            }
        }
        
        // Si on a trouvé un ID, mettre à jour le contenu
        if (docId) {
            // Code pour charger ou actualiser les documents
            // Sera implémenté selon les besoins
        }
    });
    
    // Activer l'onglet discussion par défaut
    switchTab('chat');
    
    console.log("Onglets initialisés avec succès");
    return true;
}

export default {
    name: "custom_tag_parser",
    priority: 50,
    condition: arch => {
        return arch.querySelector("counter") !== null;
    },
};