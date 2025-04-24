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
    
    // Charge les pièces jointes depuis le serveur
    function loadAttachments(pdfContainer) {
        // Vider le conteneur avant de charger les nouveaux documents
        pdfContainer.innerHTML = '<div class="text-center"><i class="fa fa-spinner fa-spin"></i> Chargement des documents...</div>';
        
        // Récupérer l'ID de la commande d'achat depuis l'URL
        var purchaseId = getCurrentPurchaseId();
        if (!purchaseId) {
            pdfContainer.innerHTML = '<div class="alert alert-warning">Impossible de déterminer la commande actuelle.</div>';
            return;
        }
        
        // Utiliser fetch au lieu de ajax.jsonRpc pour compatibilité Odoo 17
        fetch('/web/dataset/call_kw', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "call",
                params: {
                    model: 'ir.attachment',
                    method: 'search_read',
                    args: [],
                    kwargs: {
                        domain: [
                            ['res_model', '=', 'purchase.order'],
                            ['res_id', '=', purchaseId],
                            ['mimetype', 'in', ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']]
                        ],
                        fields: ['id', 'name', 'mimetype'],
                        order: 'create_date desc'
                    }
                },
                id: Math.floor(Math.random() * 1000000)
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.result) {
                renderAttachments(pdfContainer, data.result);
            } else {
                pdfContainer.innerHTML = '<div class="alert alert-danger">Erreur lors du chargement des documents.</div>';
            }
        })
        .catch(error => {
            pdfContainer.innerHTML = '<div class="alert alert-danger">Erreur lors du chargement des documents.</div>';
            console.error('Erreur lors du chargement des pièces jointes:', error);
        });
    }
    
    // Rend les pièces jointes dans le conteneur
    function renderAttachments(pdfContainer, attachments) {
        // Vider le conteneur
        pdfContainer.innerHTML = '';
        
        // Si aucune pièce jointe, afficher un message
        if (!attachments || attachments.length === 0) {
            pdfContainer.innerHTML = '<div class="alert alert-info">Aucun document PDF ou image n\'est attaché à cette commande.</div>';
            return;
        }
        
        // Créer un élément pour chaque pièce jointe
        attachments.forEach(function(attachment) {
            var fileUrl = '/web/content/' + attachment.id + '?download=true';
            var attachmentDiv = document.createElement('div');
            attachmentDiv.className = 'mb-5 attachment-item';
            
            var header = document.createElement('div');
            header.className = 'attachment-header mb-3';
            header.innerHTML = '<h5>' + attachment.name + '</h5>';
            
            attachmentDiv.appendChild(header);
            
            // Si c'est un PDF, l'afficher avec <embed> et agrandir la hauteur
            if (attachment.mimetype === 'application/pdf') {
                var embed = document.createElement('embed');
                embed.src = fileUrl;
                embed.type = 'application/pdf';
                embed.width = '100%';
                embed.height = '800px'; // Hauteur augmentée pour mieux voir le document
                embed.style.border = '1px solid #e2e2e2';
                attachmentDiv.appendChild(embed);
            } 
            // Si c'est une image, l'afficher avec <img>
            else if (attachment.mimetype.startsWith('image/')) {
                var img = document.createElement('img');
                img.src = fileUrl;
                img.style.maxWidth = '100%';
                img.style.maxHeight = '800px'; // Hauteur augmentée
                img.style.objectFit = 'contain';
                img.style.display = 'block';
                img.style.margin = '0 auto';
                img.style.border = '1px solid #e2e2e2';
                attachmentDiv.appendChild(img);
            }
            
            pdfContainer.appendChild(attachmentDiv);
        });
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