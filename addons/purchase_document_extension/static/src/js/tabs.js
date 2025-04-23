// Script simple pour gérer les onglets entre chat et documents
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
        const docsArea = document.getElementById('documents_area');
        
        if (tabChat && tabDocs && chatter && docsArea) {
            initTabs(tabChat, tabDocs, chatter, docsArea);
        }
    }
    
    // Initialise les onglets s'ils n'ont pas déjà été initialisés
    function initTabs(tabChat, tabDocs, chatter, docsArea) {
        // Évite les doublons d'écouteurs d'événements
        if (tabChat.hasListener) return;
        
        // Fonction pour basculer entre les onglets
        function switchTab(activeTab) {
            if (activeTab === 'chat') {
                tabChat.classList.add('active');
                tabDocs.classList.remove('active');
                chatter.style.display = '';
                docsArea.style.display = 'none';
            } else {
                tabChat.classList.remove('active');
                tabDocs.classList.add('active');
                chatter.style.display = 'none';
                docsArea.style.display = '';
            }
        }
        
        // Ajouter les écouteurs d'événements
        tabChat.addEventListener('click', function(e) {
            e.preventDefault();
            switchTab('chat');
        });
        tabChat.hasListener = true;
        
        tabDocs.addEventListener('click', function(e) {
            e.preventDefault();
            switchTab('docs');
        });
        tabDocs.hasListener = true;
        
        // Afficher le chat par défaut
        switchTab('chat');
    }
});