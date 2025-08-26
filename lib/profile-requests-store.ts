// Simple file-based storage for profile change requests
// This persists data between server restarts

import { promises as fs } from 'fs';
import path from 'path';

interface ProfileChangeRequest {
  id: string;
  employee_id: number;
  employee_name: string;
  manager_id: number;
  manager_name: string;
  requested_changes: Record<string, any>;
  comment: string;
  state: 'pending' | 'approved' | 'rejected';
  request_date: string;
  approved_date?: string;
  rejected_date?: string;
  approved_by?: number;
  rejected_by?: number;
  approval_comment?: string;
  rejection_comment?: string;
}

class ProfileRequestsStore {
  private requests: Map<string, ProfileChangeRequest> = new Map();
  private storageFile: string;

  constructor() {
    // Store in a JSON file in the project root
    this.storageFile = path.join(process.cwd(), 'profile-requests.json');
    this.loadFromFile();
  }

  private async loadFromFile() {
    try {
      const data = await fs.readFile(this.storageFile, 'utf8');
      const requests = JSON.parse(data);
      this.requests.clear();
      requests.forEach((req: ProfileChangeRequest) => {
        this.requests.set(req.id, req);
      });
      console.log('✅ Loaded', this.requests.size, 'requests from file');
    } catch (error) {
      // File doesn't exist or is invalid, start with empty store
      console.log('📝 No existing requests file found, starting with empty store');
    }
  }

  private async saveToFile() {
    try {
      const requests = Array.from(this.requests.values());
      await fs.writeFile(this.storageFile, JSON.stringify(requests, null, 2));
      console.log('✅ Saved', requests.length, 'requests to file');
    } catch (error) {
      console.error('❌ Failed to save requests to file:', error);
    }
  }

  async createRequest(request: Omit<ProfileChangeRequest, 'id' | 'request_date'>): Promise<string> {
    const id = Date.now().toString() + '_' + request.employee_id;
    const newRequest: ProfileChangeRequest = {
      ...request,
      id,
      request_date: new Date().toISOString()
    };
    this.requests.set(id, newRequest);
    await this.saveToFile();
    return id;
  }

  getRequest(id: string): ProfileChangeRequest | undefined {
    return this.requests.get(id);
  }

  getPendingRequestsForManager(managerId: number): ProfileChangeRequest[] {
    return Array.from(this.requests.values()).filter(
      req => req.manager_id === managerId && req.state === 'pending'
    );
  }

  getRequestsForEmployee(employeeId: number): ProfileChangeRequest[] {
    return Array.from(this.requests.values()).filter(
      req => req.employee_id === employeeId
    );
  }

  async approveRequest(id: string, approvedBy: number, comment?: string): Promise<boolean> {
    const request = this.requests.get(id);
    if (!request || request.state !== 'pending') {
      return false;
    }

    request.state = 'approved';
    request.approved_date = new Date().toISOString();
    request.approved_by = approvedBy;
    request.approval_comment = comment || '';
    
    this.requests.set(id, request);
    await this.saveToFile();
    return true;
  }

  async rejectRequest(id: string, rejectedBy: number, comment?: string): Promise<boolean> {
    const request = this.requests.get(id);
    if (!request || request.state !== 'pending') {
      return false;
    }

    request.state = 'rejected';
    request.rejected_date = new Date().toISOString();
    request.rejected_by = rejectedBy;
    request.rejection_comment = comment || '';
    
    this.requests.set(id, request);
    await this.saveToFile();
    return true;
  }

  // Get all requests (for debugging)
  getAllRequests(): ProfileChangeRequest[] {
    return Array.from(this.requests.values());
  }

  // Clear all requests (for testing)
  async clearAll(): Promise<void> {
    this.requests.clear();
    await this.saveToFile();
  }
}

// Create a singleton instance
export const profileRequestsStore = new ProfileRequestsStore(); 