from odoo import models, fields, api
import base64
import logging
from io import BytesIO
from PyPDF2 import PdfMerger, PdfReader, PdfWriter

_logger = logging.getLogger(__name__)

class PurchaseOrder(models.Model):
    _inherit = 'purchase.order'
    
    # Champs pour stocker les pièces jointes
    attachment_ids = fields.Many2many(
        'ir.attachment',
        string='Documents',
        domain="[('res_model', '=', 'purchase.order'), ('res_id', '=', id)]"
    )
    attachment_count = fields.Integer(
        compute='_compute_attachment_count',
        string='Nombre de documents'
    )
    merged_pdf = fields.Binary('PDF Fusionné', attachment=False, copy=False)
    merged_pdf_name = fields.Char('Nom du PDF fusionné', copy=False)
    
    @api.depends('attachment_ids')
    def _compute_attachment_count(self):
        for record in self:
            # Compter toutes les pièces jointes liées à ce bon de commande
            attachment_count = self.env['ir.attachment'].search_count([
                ('res_model', '=', 'purchase.order'),
                ('res_id', '=', record.id)
            ])
            record.attachment_count = attachment_count
    
    def action_open_attachments(self):
        # Ouvrir la vue des pièces jointes pour ce bon de commande
        action = {
            'name': 'Documents',
            'type': 'ir.actions.act_window',
            'res_model': 'ir.attachment',
            'view_mode': 'kanban,tree,form',
            'domain': [('res_model', '=', 'purchase.order'), ('res_id', '=', self.id)],
            'context': {'default_res_model': 'purchase.order', 'default_res_id': self.id},
        }
        return action

    @api.onchange('attachment_ids')
    def _onchange_attachment_ids(self):
        """Lors de l'ajout/suppression d'une pièce jointe, on remet à zéro le PDF fusionné"""
        for record in self:
            record.merged_pdf = False
            record.merged_pdf_name = False

    @api.onchange('partner_id')
    def _onchange_partner_id_documents(self):
        """
        Lorsqu'on change de fournisseur ou que ses documents changent, on fusionne les PDF.
        """
        for order in self:
            if order.partner_id and hasattr(order.partner_id, 'documents'):
                order.merge_pdfs()
    
    def merge_pdfs(self):
        import base64
        import io
        from PyPDF2 import PdfMerger
        for order in self:
            pdf_datas = []
            # Récupérer tous les documents PDF attachés à ce bon de commande
            for doc in order.attachment_ids:
                if doc.mimetype == 'application/pdf' and doc.datas:
                    try:
                        pdf_datas.append(base64.b64decode(doc.datas))
                    except Exception:
                        pdf_datas.append(doc.datas)
            _logger.info(f"Fusion PDF: {len(pdf_datas)} PDF trouvés pour la commande {order.name} (ID {order.id})")
            if not pdf_datas:
                _logger.warning(f"Aucun PDF trouvé pour la commande {order.name} (ID {order.id})")
                order.merged_pdf = False
                order.merged_pdf_name = False
                continue
            if len(pdf_datas) == 1:
                order.merged_pdf = base64.b64encode(pdf_datas[0])
                order.merged_pdf_name = 'document_fusionne.pdf'
                continue
            merger = PdfMerger()
            for pdf_data in pdf_datas:
                merger.append(io.BytesIO(pdf_data))
            out = io.BytesIO()
            merger.write(out)
            merger.close()
            out.seek(0)
            order.merged_pdf = base64.b64encode(out.read())
            order.merged_pdf_name = 'documents_fusionnes.pdf'
    
    def action_view_merged_pdf(self):
        """Ouvrir le PDF fusionné pour visualisation"""
        self.ensure_one()
        
        # Si pas de PDF fusionné, on le crée
        if not self.merged_pdf:
            return self.merge_pdfs()
        
        # Retourner une action pour afficher le PDF
        attachment = self.env['ir.attachment'].create({
            'name': self.merged_pdf_name or f"documents_fusionnes_{self.name}.pdf",
            'type': 'binary',
            'datas': self.merged_pdf,
            'res_model': self._name,
            'res_id': self.id,
            'mimetype': 'application/pdf'
        })
        
        return {
            'type': 'ir.actions.act_url',
            'url': f'/web/content/{attachment.id}?download=true',
            'target': 'self',
        }
    
    # Surcharge de l'écriture pour mettre à jour les pièces jointes
    @api.model_create_multi
    def create(self, vals_list):
        """
        Override create to ensure PDFs are merged for new records with initial attachments
        """
        records = super(PurchaseOrder, self).create(vals_list)
        for record in records:
            # Merge PDFs if any attachments present
            if record.attachment_ids:
                record.merge_pdfs()
        return records
    
    def write(self, vals):
        """
        Override write to merge PDFs automatically when attachments_ids are updated
        """
        res = super(PurchaseOrder, self).write(vals)
        # Trigger merge when attachments change
        if 'attachment_ids' in vals:
            for record in self:
                record.merge_pdfs()
        return res
    
    def _update_attachment_relation(self):
        """Mettre à jour la relation entre le bon de commande et ses pièces jointes"""
        for record in self:
            # Rechercher toutes les pièces jointes qui devraient être liées à ce bon de commande
            attachments = self.env['ir.attachment'].search([
                ('res_model', '=', 'purchase.order'),
                ('res_id', '=', record.id)
            ])
            
            # Mettre à jour le champ attachment_ids sans déclencher _onchange_attachment_ids
            if attachments:
                record.with_context(no_attachment_onchange=True).attachment_ids = [(6, 0, attachments.ids)]