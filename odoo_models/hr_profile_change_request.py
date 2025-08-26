from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
import json

class HrProfileChangeRequest(models.Model):
    _name = 'hr.profile.change.request'
    _description = 'Profile Change Request'
    _order = 'create_date desc'

    employee_id = fields.Many2one('hr.employee', string='Employee', required=True, ondelete='cascade')
    manager_id = fields.Many2one('hr.employee', string='Manager', required=True, ondelete='cascade')
    requested_changes = fields.Text(string='Requested Changes', required=True)
    comment = fields.Text(string='Employee Comment')
    state = fields.Selection([
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    ], string='Status', default='pending', required=True)
    
    request_date = fields.Datetime(string='Request Date', default=fields.Datetime.now)
    approved_date = fields.Datetime(string='Approved Date')
    rejected_date = fields.Datetime(string='Rejected Date')
    approved_by = fields.Many2one('hr.employee', string='Approved By')
    rejected_by = fields.Many2one('hr.employee', string='Rejected By')
    approval_comment = fields.Text(string='Approval Comment')
    rejection_comment = fields.Text(string='Rejection Comment')

    @api.constrains('employee_id', 'manager_id')
    def _check_manager_relationship(self):
        for record in self:
            if record.employee_id and record.manager_id:
                if record.employee_id.parent_id != record.manager_id:
                    raise ValidationError(_('The manager must be the direct manager of the employee.'))

    def action_approve(self):
        """Approve the profile change request and apply changes"""
        for record in self:
            if record.state != 'pending':
                raise ValidationError(_('Only pending requests can be approved.'))
            
            try:
                # Parse the requested changes
                changes = json.loads(record.requested_changes)
                
                # Apply changes to employee profile
                record.employee_id.write(changes)
                
                # Update request status
                record.write({
                    'state': 'approved',
                    'approved_date': fields.Datetime.now(),
                    'approved_by': self.env.user.employee_id.id,
                })
                
            except json.JSONDecodeError:
                raise ValidationError(_('Invalid changes format.'))
            except Exception as e:
                raise ValidationError(_('Failed to apply changes: %s') % str(e))

    def action_reject(self):
        """Reject the profile change request"""
        for record in self:
            if record.state != 'pending':
                raise ValidationError(_('Only pending requests can be rejected.'))
            
            record.write({
                'state': 'rejected',
                'rejected_date': fields.Datetime.now(),
                'rejected_by': self.env.user.employee_id.id,
            })

    def name_get(self):
        """Custom name display"""
        result = []
        for record in self:
            name = f"Profile Change Request #{record.id} - {record.employee_id.name}"
            result.append((record.id, name))
        return result 