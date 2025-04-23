/** @odoo-module **/

// Script simple pour gérer les onglets entre documents et chatter
odoo.define('purchase_document_extension.tabs', [], function (require) {
    'use strict';

    // Attend que le document soit complètement chargé
    document.addEventListener('DOMContentLoaded', function() {
        // Démarre la vérification périodique
        setInterval(checkTabElements, 1000);
    });

    // Vérifie si les éléments des onglets existent et les initialise
    function checkTabElements() {
        const tabChat = document.getElementById('tab_chat');
        const tabDocs = document.getElementById('tab_docs');
        const chatter = document.querySelector('.oe_chatter');
        const docsContent = document.getElementById('docs_content');
        
        if (tabChat && tabDocs && chatter && docsContent) {
            console.log("Éléments d'onglets trouvés, initialisation...");
            initTabs(tabChat, tabDocs, chatter, docsContent);
        } else {
            console.log("Éléments d'onglets non trouvés, nouvelle tentative dans 1s");
            console.log("tab_chat:", tabChat);
            console.log("tab_docs:", tabDocs);
            console.log("chatter:", chatter);
            console.log("docs_content:", docsContent);
        }
    }
    
    // Initialise les onglets s'ils n'ont pas déjà été initialisés
    function initTabs(tabChat, tabDocs, chatter, docsContent) {
        // Évite les doublons d'écouteurs d'événements
        if (tabChat.hasListener) {
            console.log("Onglets déjà initialisés");
            return;
        }
        
        console.log("Initialisation des onglets");
        
        // Fonction pour basculer entre les onglets
        function switchTab(activeTab) {
            console.log("Changement d'onglet vers:", activeTab);
            
            if (activeTab === 'chat') {
                tabChat.classList.add('active');
                tabDocs.classList.remove('active');
                tabChat.style.borderLeftColor = '#007bff';
                tabChat.style.backgroundColor = '#e9f5ff';
                tabChat.style.fontWeight = 'bold';
                tabDocs.style.borderLeftColor = 'transparent';
                tabDocs.style.backgroundColor = 'transparent';
                tabDocs.style.fontWeight = 'normal';
                chatter.style.display = '';
                docsContent.style.display = 'none';
            } else {
                tabChat.classList.remove('active');
                tabDocs.classList.add('active');
                tabDocs.style.borderLeftColor = '#007bff';
                tabDocs.style.backgroundColor = '#e9f5ff';
                tabDocs.style.fontWeight = 'bold';
                tabChat.style.borderLeftColor = 'transparent';
                tabChat.style.backgroundColor = 'transparent';
                tabChat.style.fontWeight = 'normal';
                chatter.style.display = 'none';
                docsContent.style.display = '';
            }
        }
        
        // Ajouter les écouteurs d'événements
        tabChat.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Clic sur l'onglet chat");
            switchTab('chat');
        });
        tabChat.hasListener = true;
        
        tabDocs.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Clic sur l'onglet documents");
            switchTab('docs');
        });
        tabDocs.hasListener = true;
        
        // Afficher le chat par défaut
        switchTab('chat');
        
        console.log("Onglets initialisés avec succès");
    }
});