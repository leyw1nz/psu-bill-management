/**
 * PSU Open API Service
 * Handles all PSU Open API related calls
 */

import { StaffDetails, PSUAPIResponse } from '@/types';

class PSUOpenAPIService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.PSU_API_URL || '';
    this.apiKey = process.env.PSU_API_KEY || '';

    if (!this.baseUrl || !this.apiKey) {
      console.warn('PSU Open API configuration is missing. Please check .env file.');
    }
  }

  /**
   * Get staff details by username
   * @param username - PSU username
   * @returns Staff details
   */
  async getStaffDetailsByUserName(username: string): Promise<PSUAPIResponse<StaffDetails>> {
    try {
      if (!this.baseUrl || !this.apiKey) {
        return {
          success: false,
          error: 'PSU Open API is not configured. Please set PSU_API_URL and PSU_API_KEY in .env file.',
        };
      }

      if (!username) {
        return {
          success: false,
          error: 'Username is required',
        };
      }

      const myHeaders = new Headers();
      myHeaders.append('credential', `api_key=${this.apiKey}`);

      const requestOptions: RequestInit = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow',
      };

      const response = await fetch(
        `${this.baseUrl}/Personnel/GetStaffDetailsByUserName/${username}`,
        requestOptions
      );

      if (!response.ok) {
        return {
          success: false,
          error: `API request failed with status ${response.status}: ${response.statusText}`,
        };
      }

      const result = await response.json();

      // Check if data array exists and has at least one record
      if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
        return {
          success: false,
          error: 'No staff data found for the given username',
        };
      }

      // Get the first staff record from the data array
      const staffRecord = result.data[0];

      // Map the API response to StaffDetails interface with all fields
      const staffDetails: StaffDetails = {
        // Staff Identification
        staffId: staffRecord.staffId,
        username: staffRecord.username,
        staffEmail: staffRecord.staffEmail,

        // Thai Name
        titleNameThai: staffRecord.titleNameThai,
        staffNameThai: staffRecord.staffNameThai,
        staffSnameThai: staffRecord.staffSnameThai,

        // English Name
        titleNameEng: staffRecord.titleNameEng,
        titleShortEng: staffRecord.titleShortEng,
        staffNameEng: staffRecord.staffNameEng,
        staffSnameEng: staffRecord.staffSnameEng,

        // Campus Information
        campId: staffRecord.campId,
        campNameThai: staffRecord.campNameThai,

        // Faculty/Department Information
        facId: staffRecord.facId,
        facNameThai: staffRecord.facNameThai,
        deptId: staffRecord.deptId,
        deptNameThai: staffRecord.deptNameThai,

        // Staff Type and Position
        staffTypeName: staffRecord.staffTypeName,
        staffType: staffRecord.staffType,
        staffDepart: staffRecord.staffDepart,
        posId: staffRecord.posId,
        posNameThai: staffRecord.posNameThai,
        posNameEng: staffRecord.posNameEng,
        posTypeName: staffRecord.posTypeName,

        // Additional Information
        isDoctor: staffRecord.isDoctor,
        workTelephone: staffRecord.workTelephone,
      };

      return {
        success: true,
        data: staffDetails,
      };
    } catch (error) {
      console.error('Error fetching staff details from PSU Open API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch staff details',
      };
    }
  }

  /**
   * Get staff details by staff name or surname
   * @param nameOrSurname - Staff name or surname
   * @returns Array of staff details (multiple matches possible)
   */
  async getStaffDetailsByStaffNameOrSurName(nameOrSurname: string): Promise<PSUAPIResponse<StaffDetails[]>> {
    try {
      if (!this.baseUrl || !this.apiKey) {
        return {
          success: false,
          error: 'PSU Open API is not configured. Please set PSU_API_URL and PSU_API_KEY in .env file.',
        };
      }

      if (!nameOrSurname) {
        return {
          success: false,
          error: 'Name or surname is required',
        };
      }

      const myHeaders = new Headers();
      myHeaders.append('credential', `api_key=${this.apiKey}`);

      const requestOptions: RequestInit = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow',
      };

      const response = await fetch(
        `${this.baseUrl}/Personnel/GetStaffDetailsByStaffNameOrSurName/${encodeURIComponent(nameOrSurname)}`,
        requestOptions
      );

      if (!response.ok) {
        return {
          success: false,
          error: `API request failed with status ${response.status}: ${response.statusText}`,
        };
      }

      const result = await response.json();

      // Check if data array exists and has at least one record
      if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
        return {
          success: false,
          error: 'No staff data found for the given name or surname',
        };
      }

      // Map all staff records from the data array
      const staffDetailsList: StaffDetails[] = result.data.map((staffRecord: any) => ({
        // Staff Identification
        staffId: staffRecord.staffId,
        username: staffRecord.username,
        staffEmail: staffRecord.staffEmail,

        // Thai Name
        titleNameThai: staffRecord.titleNameThai,
        staffNameThai: staffRecord.staffNameThai,
        staffSnameThai: staffRecord.staffSnameThai,

        // English Name
        titleNameEng: staffRecord.titleNameEng,
        titleShortEng: staffRecord.titleShortEng,
        staffNameEng: staffRecord.staffNameEng,
        staffSnameEng: staffRecord.staffSnameEng,

        // Campus Information
        campId: staffRecord.campId,
        campNameThai: staffRecord.campNameThai,

        // Faculty/Department Information
        facId: staffRecord.facId,
        facNameThai: staffRecord.facNameThai,
        deptId: staffRecord.deptId,
        deptNameThai: staffRecord.deptNameThai,

        // Staff Type and Position
        staffTypeName: staffRecord.staffTypeName,
        staffType: staffRecord.staffType,
        staffDepart: staffRecord.staffDepart,
        posId: staffRecord.posId,
        posNameThai: staffRecord.posNameThai,
        posNameEng: staffRecord.posNameEng,
        posTypeName: staffRecord.posTypeName,

        // Additional Information
        isDoctor: staffRecord.isDoctor,
        workTelephone: staffRecord.workTelephone,
      }));

      return {
        success: true,
        data: staffDetailsList,
      };
    } catch (error) {
      console.error('Error fetching staff details from PSU Open API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch staff details',
      };
    }
  }

  /**
   * Get staff details by email
   * @param email - Staff email
   * @returns Staff details
   */
  async getStaffDetailsByEmail(email: string): Promise<PSUAPIResponse<StaffDetails>> {
    try {
      if (!this.baseUrl || !this.apiKey) {
        return {
          success: false,
          error: 'PSU Open API is not configured. Please set PSU_API_URL and PSU_API_KEY in .env file.',
        };
      }

      if (!email) {
        return {
          success: false,
          error: 'Email is required',
        };
      }

      const myHeaders = new Headers();
      myHeaders.append('credential', `api_key=${this.apiKey}`);

      const requestOptions: RequestInit = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow',
      };

      const response = await fetch(
        `${this.baseUrl}/Personnel/GetStaffDetailsByEmail/${email}`,
        requestOptions
      );

      if (!response.ok) {
        return {
          success: false,
          error: `API request failed with status ${response.status}: ${response.statusText}`,
        };
      }

      const result = await response.json();

      // Check if data array exists and has at least one record
      if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
        return {
          success: false,
          error: 'No staff data found for the given email',
        };
      }

      // Get the first staff record from the data array
      const staffRecord = result.data[0];

      // Map the API response to StaffDetails interface with all fields
      const staffDetails: StaffDetails = {
        // Staff Identification
        staffId: staffRecord.staffId,
        username: staffRecord.username,
        staffEmail: staffRecord.staffEmail,

        // Thai Name
        titleNameThai: staffRecord.titleNameThai,
        staffNameThai: staffRecord.staffNameThai,
        staffSnameThai: staffRecord.staffSnameThai,

        // English Name
        titleNameEng: staffRecord.titleNameEng,
        titleShortEng: staffRecord.titleShortEng,
        staffNameEng: staffRecord.staffNameEng,
        staffSnameEng: staffRecord.staffSnameEng,

        // Campus Information
        campId: staffRecord.campId,
        campNameThai: staffRecord.campNameThai,

        // Faculty/Department Information
        facId: staffRecord.facId,
        facNameThai: staffRecord.facNameThai,
        deptId: staffRecord.deptId,
        deptNameThai: staffRecord.deptNameThai,

        // Staff Type and Position
        staffTypeName: staffRecord.staffTypeName,
        staffType: staffRecord.staffType,
        staffDepart: staffRecord.staffDepart,
        posId: staffRecord.posId,
        posNameThai: staffRecord.posNameThai,
        posNameEng: staffRecord.posNameEng,
        posTypeName: staffRecord.posTypeName,

        // Additional Information
        isDoctor: staffRecord.isDoctor,
        workTelephone: staffRecord.workTelephone,
      };

      return {
        success: true,
        data: staffDetails,
      };
    } catch (error) {
      console.error('Error fetching staff details from PSU Open API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch staff details',
      };
    }
  }
}

// Export singleton instance
export const psuOpenAPIService = new PSUOpenAPIService();
