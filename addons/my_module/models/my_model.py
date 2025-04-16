from odoo import models, fields, api

class MyModel(models.Model):
    _name = 'my_module.my_model'
    _description = 'My Custom Model'

    name = fields.Char('Name', required=True)
    description = fields.Text('Description')
    date = fields.Date('Date')
    
    @api.onchange('name')
    def onchange_name(self):
        for record in self:
            if record.name:
                record.description = record.name.upper()

class model2(models.Model):
    _name = 'my_module.model2'
    _description = 'My Custom Model2'
    
    my_model_id = fields.Many2one('my_module.my_model', 'My Model', required=True)
    name = fields.Char('Name', required=True)
    state = fields.Selection([
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
    ], string='Status', default='draft')
    
    def write(self, vals):
        """Surcharge de la méthode write pour confirmer automatiquement les enregistrements lors de la sauvegarde"""
        res = super(model2, self).write(vals)
        
        # Si l'enregistrement est encore en brouillon après la mise à jour, le confirmer
        for record in self:
            if record.state == 'draft':
                record.state = 'confirmed'
                
        return res
    
    @api.model_create_multi
    def create(self, vals_list):
        """Surcharge de la méthode create pour confirmer automatiquement les nouveaux enregistrements"""
        records = super(model2, self).create(vals_list)
        
        # Confirmer tous les nouveaux enregistrements
        for record in records:
            if record.state == 'draft':
                record.state = 'confirmed'
                
        return records