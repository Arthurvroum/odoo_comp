from odoo import http
from odoo.http import request
import base64

class PurchaseDocumentExtensionController(http.Controller):
    @http.route('/purchase_document_extension/merged_pdf/<int:order_id>', type='http', auth='user')
    def merged_pdf(self, order_id, **kwargs):
        order = request.env['purchase.order'].sudo().browse(order_id)
        if not order:
            return request.not_found()
        # Ensure merged_pdf is generated
        if not order.merged_pdf:
            order.sudo().merge_pdfs()
            # Reload record to get updated merged_pdf
            order = request.env['purchase.order'].sudo().browse(order_id)
            if not order.merged_pdf:
                return request.not_found()
        pdf_content = base64.b64decode(order.merged_pdf)
        filename = order.merged_pdf_name or f'merged_{order.id}.pdf'
        return request.make_response(
            pdf_content,
            headers=[
                ('Content-Type', 'application/pdf'),
                ('Content-Disposition', f'attachment; filename="{filename}"')
            ]
        )
