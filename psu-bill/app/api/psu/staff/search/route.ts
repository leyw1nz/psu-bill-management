import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/psu/staff/search?q=nameOrSurname
 * Search for PSU staff by name or surname using PSU Open API
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Search query is required',
        },
        { status: 400 }
      );
    }

    const PSU_API_URL = process.env.PSU_API_URL;
    const PSU_API_KEY = process.env.PSU_API_KEY;

    if (!PSU_API_URL || !PSU_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'PSU Open API is not configured',
        },
        { status: 500 }
      );
    }

    const myHeaders = new Headers();
    myHeaders.append('credential', `api_key=${PSU_API_KEY}`);

    const response = await fetch(
      `${PSU_API_URL}/Personnel/GetStaffDetailsByStaffNameOrSurName/${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow',
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `API request failed with status ${response.status}`,
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Check if data array exists and has at least one record
    if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No staff data found for the given name or surname',
      });
    }

    // Map staff records to consistent interface
    const staffDetailsList = result.data.map((staffRecord: any) => ({
      // Staff Identification - handle both staffId and StaffId
      staffId: staffRecord.staffId || staffRecord.StaffId,
      username: staffRecord.username || staffRecord.Username,
      staffEmail: staffRecord.staffEmail || staffRecord.StaffEmail,

      // Thai Name
      titleNameThai: staffRecord.titleNameThai || staffRecord.TitleNameThai,
      staffNameThai: staffRecord.staffNameThai || staffRecord.StaffNameThai,
      staffSnameThai: staffRecord.staffSnameThai || staffRecord.StaffSnameThai,

      // English Name
      titleNameEng: staffRecord.titleNameEng || staffRecord.TitleNameEng,
      titleShortEng: staffRecord.titleShortEng || staffRecord.TitleShortEng,
      staffNameEng: staffRecord.staffNameEng || staffRecord.StaffNameEng,
      staffSnameEng: staffRecord.staffSnameEng || staffRecord.StaffSnameEng,

      // Campus Information
      campId: staffRecord.campId || staffRecord.CampId,
      campNameThai: staffRecord.campNameThai || staffRecord.CampNameThai,

      // Faculty/Department Information
      facId: staffRecord.facId || staffRecord.FacId,
      facNameThai: staffRecord.facNameThai || staffRecord.FacNameThai,
      deptId: staffRecord.deptId || staffRecord.DeptId,
      deptNameThai: staffRecord.deptNameThai || staffRecord.DeptNameThai,

      // Staff Type and Position
      staffTypeName: staffRecord.staffTypeName || staffRecord.StaffTypeName,
      staffType: staffRecord.staffType || staffRecord.StaffType,
      staffDepart: staffRecord.staffDepart || staffRecord.StaffDepart,
      posId: staffRecord.posId || staffRecord.PosId,
      posNameThai: staffRecord.posNameThai || staffRecord.PosNameThai,
      posNameEng: staffRecord.posNameEng || staffRecord.PosNameEng,
      posTypeName: staffRecord.posTypeName || staffRecord.PosTypeName,

      // Additional Information
      isDoctor: staffRecord.isDoctor || staffRecord.IsDoctor,
      workTelephone: staffRecord.workTelephone || staffRecord.WorkTelephone,
    }));

    return NextResponse.json({
      success: true,
      data: staffDetailsList,
    });
  } catch (error) {
    console.error('Error searching PSU staff:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search staff',
      },
      { status: 500 }
    );
  }
}
