{
    'name': 'HR Profile Change Request',
    'version': '1.0',
    'category': 'Human Resources',
    'summary': 'Allow employees to request profile changes with manager approval',
    'description': """
        This module allows employees to request changes to their profile information,
        which must be approved by their direct manager before being applied.
        
        Features:
        - Employee profile change requests
        - Manager approval workflow
        - Automatic application of approved changes
        - Request history tracking
    """,
    'author': 'Your Company',
    'website': 'https://www.yourcompany.com',
    'depends': ['hr', 'base'],
    'data': [
        'security/ir.model.access.csv',
        'views/hr_profile_change_request_views.xml',
        'views/hr_employee_views.xml',
    ],
    'demo': [],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
} 