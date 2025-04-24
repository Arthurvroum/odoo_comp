from odoo import models, api, fields
import logging

class IrAttachment(models.Model):
    _inherit = 'ir.attachment'
    
    @api.model_create_multi
    def create(self, vals_list):
        """Surcharge de la méthode create pour mettre à jour le PDF fusionné"""
        # Créer les attachements normalement
        attachments = super(IrAttachment, self).create(vals_list)
        
        # Pour chaque nouvel attachement, vérifier s'il faut mettre à jour le PDF fusionné
        purchase_orders_to_update = set()
        
        for attachment in attachments:
            # Vérifier si c'est un PDF lié à un bon de commande
            if (attachment.mimetype == 'application/pdf' and 
                attachment.res_model == 'purchase.order' and 
                attachment.res_id):
                
                # Récupérer le bon de commande concerné
                purchase_order = self.env['purchase.order'].browse(attachment.res_id)
                
                # Vérifier que le bon de commande existe et que ce n'est pas le PDF fusionné lui-même
                if purchase_order.exists() and attachment.name != purchase_order.merged_pdf_name:
                    purchase_orders_to_update.add(purchase_order.id)
        
        # Mettre à jour les PDFs fusionnés des bons de commande concernés
        for po_id in purchase_orders_to_update:
            try:
                purchase_order = self.env['purchase.order'].browse(po_id)
                if purchase_order.exists():
                    logging.info(f"Mise à jour automatique du PDF fusionné pour la commande {po_id} (ajout de pièce jointe)")
                    purchase_order.update_merged_pdf()
            except Exception as e:
                logging.error(f"Erreur lors de la mise à jour du PDF fusionné: {str(e)}")
        
        return attachments
    
    def unlink(self):
        """Surcharge de la méthode unlink pour mettre à jour le PDF fusionné"""
        # Identifier les bons de commande concernés avant la suppression
        purchase_orders_to_update = set()
        
        for attachment in self:
            if (attachment.mimetype == 'application/pdf' and 
                attachment.res_model == 'purchase.order' and 
                attachment.res_id):
                
                purchase_order = self.env['purchase.order'].browse(attachment.res_id)
                
                # Vérifier que le bon de commande existe et que ce n'est pas le PDF fusionné lui-même
                if purchase_order.exists() and attachment.name != purchase_order.merged_pdf_name:
                    purchase_orders_to_update.add(purchase_order.id)
        
        # Supprimer les attachements
        result = super(IrAttachment, self).unlink()
        
        # Mettre à jour les PDFs fusionnés des bons de commande concernés
        for po_id in purchase_orders_to_update:
            try:
                purchase_order = self.env['purchase.order'].browse(po_id)
                if purchase_order.exists():
                    logging.info(f"Mise à jour automatique du PDF fusionné pour la commande {po_id} (suppression de pièce jointe)")
                    purchase_order.update_merged_pdf()
            except Exception as e:
                logging.error(f"Erreur lors de la mise à jour du PDF fusionné: {str(e)}")
        
        return result

class ResPartner(models.Model):
    _inherit = 'res.partner'

    documents = fields.One2many('ir.attachment', 'res_id', domain="[('res_model','=','res.partner')]", string='Documents')

    @api.model
    def create(self, vals):
        partner = super().create(vals)
        partner._update_purchase_orders_merged_pdf()
        return partner

    def write(self, vals):
        res = super().write(vals)
        if 'documents' in vals:
            for partner in self:
                orders = self.env['purchase.order'].search([('partner_id', '=', partner.id)])
                for order in orders:
                    order.merge_pdfs()
        self._update_purchase_orders_merged_pdf()
        return res

    def _update_purchase_orders_merged_pdf(self):
        for partner in self:
            orders = self.env['purchase.order'].search([('partner_id', '=', partner.id)])
            for order in orders:
                order.merge_pdfs()