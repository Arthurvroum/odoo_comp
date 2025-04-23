from odoo import models, fields, api

class PurchaseOrder(models.Model):
    _inherit = 'purchase.order'
    
    attachment_ids = fields.Many2many('ir.attachment', 'purchase_order_attachment_rel', 
                                      'purchase_id', 'attachment_id', 
                                      string='Documents')
    
    def action_add_attachment(self):
        """Méthode pour ajouter une pièce jointe (définie uniquement pour éviter les erreurs)"""
        self.ensure_one()
        return {
            'type': 'ir.actions.act_window',
            'name': 'Ajouter un document',
            'res_model': 'ir.attachment',
            'view_mode': 'form',
            'target': 'new',
            'context': {
                'default_res_model': 'purchase.order',
                'default_res_id': self.id,
            }
        }