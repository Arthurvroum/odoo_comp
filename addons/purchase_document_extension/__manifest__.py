{
    'name': 'Purchase Document Extension',
    'version': '1.0',
    'category': 'Purchases',
    'summary': 'Add document attachment feature to purchase orders',
    'depends': ['purchase'],
    'data': [
        'views/purchase_order_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'purchase_document_extension/static/src/js/tabs.js',
            'purchase_document_extension/static/src/js/pdf_viewer.js',
        ],
    },
    'external_dependencies': {
        'python': ['PyPDF2'],
    },
    'installable': True,
    'application': True,
    'auto_install': False,
}