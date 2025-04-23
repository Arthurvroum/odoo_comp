{
    'name': 'Purchase Document Extension',
    'version': '1.0',
    'category': 'Purchases',
    'summary': 'Ajoute un champ document aux bons de commande',
    'description': """
        Ce module étend les bons de commande d'achat (Purchase Orders) en ajoutant un champ permettant 
        d'importer des documents PDF et autres fichiers.
    """,
    'author': 'Odoo SA',
    'website': 'https://www.odoo.com',
    'depends': ['purchase'],
    'data': [
        'views/purchase_order_views.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
}