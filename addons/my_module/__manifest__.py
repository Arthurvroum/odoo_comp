{
    'name': 'My Module',
    'version': '1.0',
    'category': 'Extra Tools',
    'summary': 'Module personnalisé avec balise <counter>',
    'description': """
        Module personnalisé qui ajoute une balise XML personnalisée <counter>.
    """,
    'author': 'Votre Nom',
    'website': '',
    'depends': ['base', 'web'],
    'data': [
        'security/ir.model.access.csv',
        'views/my_model_views.xml',
        'views/my_model_views2.xml',
    ],
    'assets': {
        'web.assets_backend': [
            # CSS d'abord pour éviter un flash de contenu non stylisé
            'my_module/static/src/scss/custom_components.scss',
            'my_module/static/src/scss/enhanced_many2one.scss',
            
            # Composants JS dans l'ordre important
            'my_module/static/src/js/c_comp/custom_components.js',
            'my_module/static/src/js/c_comp/custom_tag_parser.js',
            
            # Composants Many2One
            'my_module/static/src/js/many_comp/button_field.js',
            'my_module/static/src/js/many_comp/enhance_many2one_parser.js',
        ],
    },
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
}