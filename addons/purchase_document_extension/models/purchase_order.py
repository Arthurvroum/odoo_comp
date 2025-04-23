from odoo import models, fields, api

class PurchaseOrder(models.Model):
    _inherit = 'purchase.order'
    
    attachment_count = fields.Integer(compute='_compute_attachment_count', string='Nombre de Documents')
    attachment_ids = fields.One2many('ir.attachment', 'res_id', domain=[('res_model', '=', 'purchase.order')], 
                                     string='Documents', readonly=False)
    
    def _compute_attachment_count(self):
        for purchase in self:
            purchase.attachment_count = self.env['ir.attachment'].search_count([
                ('res_model', '=', 'purchase.order'),
                ('res_id', '=', purchase.id)
            ])
    
    def action_open_attachments(self):
        self.ensure_one()
        return {
            'name': 'Documents',
            'domain': [('res_model', '=', 'purchase.order'), ('res_id', '=', self.id)],
            'res_model': 'ir.attachment',
            'type': 'ir.actions.act_window',
            'view_mode': 'tree,form',
            'context': {
                'default_res_model': 'purchase.order',
                'default_res_id': self.id,
            }
        }