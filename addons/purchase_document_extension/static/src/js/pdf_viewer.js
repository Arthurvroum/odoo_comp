/** @odoo-module **/

odoo.define('purchase_document_extension.pdf_viewer', [], function (require) {
    'use strict';
    
    // Attend que le document soit chargé
    document.addEventListener('DOMContentLoaded', function() {
        // Démarre la vérification périodique
        setInterval(checkPdfViewerElements, 1000);
    });
    
    // Vérifie si les éléments nécessaires sont chargés
    function checkPdfViewerElements() {
        var tabDocs = document.getElementById('tab_docs');
        var pdfContainer = document.getElementById('pdf_viewer_container');
        
        if (tabDocs && pdfContainer) {
            initPdfViewer(tabDocs, pdfContainer);
        }
    }
    
    // Initialise le PDF viewer
    function initPdfViewer(tabDocs, pdfContainer) {
        // Évite les doublons d'initialisation
        if (tabDocs.hasPdfListener) {
            return;
        }
        
        // Ajoute un écouteur pour charger les PDFs quand on clique sur l'onglet Documents
        tabDocs.addEventListener('click', function() {
            loadAttachments(pdfContainer);
        });
        tabDocs.hasPdfListener = true;
        
        // Vérifier si l'onglet Documents est actif au chargement
        setTimeout(function() {
            if (tabDocs.classList.contains('active')) {
                loadAttachments(pdfContainer);
            }
        }, 500);
    }
    
    // Charge le PDF fusionné depuis le serveur
    function loadAttachments(pdfContainer) {
        pdfContainer.innerHTML = '<div class="text-center"><i class="fa fa-spinner fa-spin"></i> Chargement du document fusionné...</div>';
        var purchaseId = getCurrentPurchaseId();
        if (!purchaseId) {
            pdfContainer.innerHTML = '<div class="alert alert-warning">Impossible de déterminer la commande actuelle.</div>';
            return;
        }
        // Vérifier l'existence du PDF fusionné via une requête GET (remplace HEAD pour supporter Odoo routes)
        fetch(`/purchase_document_extension/merged_pdf/${purchaseId}`)
            .then(resp => {
                if (resp.ok) {
                    // Afficher le PDF fusionné
                    renderMergedPdf(pdfContainer, purchaseId);
                } else {
                    pdfContainer.innerHTML = '<div class="alert alert-info">Aucun document fusionné disponible pour cette commande.</div>';
                }
            })
            .catch(() => {
                pdfContainer.innerHTML = '<div class="alert alert-danger">Erreur lors du chargement du document fusionné.</div>';
            });
    }

    // Affiche le PDF fusionné dans le conteneur
    function renderMergedPdf(pdfContainer, purchaseId) {
        pdfContainer.innerHTML = '';
        var embed = document.createElement('embed');
        embed.src = `/purchase_document_extension/merged_pdf/${purchaseId}`;
        embed.type = 'application/pdf';
        embed.width = '100%';
        embed.height = '800px';
        embed.style.border = '1px solid #e2e2e2';
        pdfContainer.appendChild(embed);
    }
    
    // Récupère l'ID de la commande actuelle depuis l'URL
    function getCurrentPurchaseId() {
        var url = window.location.href;
        console.log("URL actuelle:", url);
        
        // Tentative d'extraction de l'ID via différents patterns d'URL possibles
        
        // Format: #id=X&model=purchase.order
        var hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (hashParams.has('id') && hashParams.get('model') === 'purchase.order') {
            console.log("ID trouvé via hash params:", hashParams.get('id'));
            return parseInt(hashParams.get('id'));
        }
        
        // Format: .../purchase.order/X
        var regexPath = /\/purchase\.order\/(\d+)/;
        var matchPath = url.match(regexPath);
        if (matchPath && matchPath[1]) {
            console.log("ID trouvé via regex path:", matchPath[1]);
            return parseInt(matchPath[1]);
        }
        
        // Dernier recours: regarder s'il y a un form avec un data-id
        var formElement = document.querySelector('form.o_form_view');
        if (formElement && formElement.dataset.id) {
            console.log("ID trouvé via data-id du formulaire:", formElement.dataset.id);
            return parseInt(formElement.dataset.id);
        }
        
        // Dernier recours: regarder s'il y a un élément avec un data-res-id
        var resIdElement = document.querySelector('[data-res-id]');
        if (resIdElement && resIdElement.dataset.resId) {
            console.log("ID trouvé via data-res-id:", resIdElement.dataset.resId);
            return parseInt(resIdElement.dataset.resId);
        }
        
        console.log("Impossible de trouver l'ID de la commande");
        return null;
    }
});