// Simple script pour gérer les onglets de chat et documents
odoo.define('purchase_document_extension.tabs', [], function (require) {
    'use strict';
    
    // Fonction pour initialiser les onglets quand le DOM est chargé
    document.addEventListener('DOMContentLoaded', function() {
        // Initialiser les onglets avec un délai pour s'assurer que tout est chargé
        setTimeout(initTabSystem, 1000);
    });
    
    /**
     * Initialise le système d'onglets
     */
    function initTabSystem() {
        var tabChat = document.getElementById('tab_chat');
        var tabDocs = document.getElementById('tab_docs');
        var chatter = document.querySelector('.oe_chatter');
        var docsArea = document.getElementById('documents_area');
        
        // Si les éléments ne sont pas encore disponibles, réessayer plus tard
        if (!tabChat || !tabDocs || !chatter || !docsArea) {
            console.log("Éléments d'onglets non trouvés, réessai dans 1s");
            setTimeout(initTabSystem, 1000);
            return;
        }
        
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
        
        tabDocs.addEventListener('click', function(e) {
            e.preventDefault();
            switchTab('docs');
        });
        
        // Afficher le chat par défaut
        switchTab('chat');
        
        console.log("Système d'onglets initialisé");
    }
    
    return {
        initTabSystem: initTabSystem
    };
});