import { NextRequest, NextResponse } from 'next/server';
import {
  fetchOIDCMetadata,
  exchangeCodeForTokens,
  fetchUserInfo,
} from '@/lib/oidc';
import { User } from '@/types';
import prisma from '@/lib/prisma';
import { psuOpenAPIService } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state } = body;

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get OIDC configuration from environment variables
    const clientId = process.env.OIDC_APP_ID;
    const clientSecret = process.env.OIDC_APP_SECRET;
    const metadataUrl = process.env.OIDC_METADATA_URL;

    if (!clientId || !clientSecret || !metadataUrl) {
      return NextResponse.json(
        { error: 'OIDC configuration is missing' },
        { status: 500 }
      );
    }

    // Get state and code verifier from cookies
    const savedState = request.cookies.get('oidc_state')?.value;
    const codeVerifier = request.cookies.get('oidc_code_verifier')?.value;

    if (!savedState || !codeVerifier) {
      return NextResponse.json(
        { error: 'Session expired or invalid' },
        { status: 400 }
      );
    }

    // Verify state parameter
    if (state !== savedState) {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }

    // Fetch OIDC provider metadata
    const metadata = await fetchOIDCMetadata(metadataUrl);

    // Get the base URL for redirect URI
    // Force HTTPS in production
    const protocol = process.env.NODE_ENV === 'production'
      ? 'https'
      : (request.headers.get('x-forwarded-proto') || 'http');
    const host = request.headers.get('host') || 'localhost:3000';
    const redirectUri = `${protocol}://${host}/auth/callback`;

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(metadata.token_endpoint, {
      clientId,
      clientSecret,
      redirectUri,
      code,
      codeVerifier,
    });

    // Fetch user info from OIDC provider
    const userInfo = await fetchUserInfo(
      metadata.userinfo_endpoint,
      tokens.access_token
    );

    // Find or create user based on email
    const email = userInfo.email; //|| idTokenClaims.email;

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found in user info' },
        { status: 400 }
      );
    }

    // Extract username from email (text before @)
    const usernameFromEmail = email.split('@')[0];

    // Look for existing member in database with this email
    const member = await prisma.member.findFirst({
      where: {
        username: {
          equals: usernameFromEmail,
          mode: 'insensitive', // Case-insensitive search
        },
        delete_date: null, // Only active members
      },
    });

    let user: Omit<User, 'password'>;

    if (member) {
      user = {
        member_id: member.member_id.toString(),
        citizen_id: member.citizen_id,
        staff_id: member.staff_id,
        email: member.email || email,
        title: member.title,
        name: member.name || userInfo.given_name || '',
        surname: member.surname || userInfo.family_name || '',
        phone: member.phone,
        username: member.username || userInfo.preferred_username || email,
        role_id: member.role_id,
        create_date: member.create_date,
        modify_date: member.modify_date,
        delete_date: member.delete_date
      };
    } else {
      // Fetch staff details from PSU Open API
      let staffDetails = null;
      try {
        const staffResponse = await psuOpenAPIService.getStaffDetailsByUserName(usernameFromEmail);
        if (staffResponse.success && staffResponse.data) {
          staffDetails = staffResponse.data;
          console.log('Staff details retrieved from PSU API:', staffDetails);
        }
      } catch (error) {
        console.warn('Failed to fetch staff details from PSU API:', error);
        // Continue without staff details if API fails
      }

      const newMember = await prisma.member.create({
        data: {
          staff_id: staffDetails?.staffId || null,
          email: email,
          username: usernameFromEmail,
          title: staffDetails?.titleNameThai || null,
          name: staffDetails?.staffNameThai || '',
          surname: staffDetails?.staffSnameThai || '',
          phone: staffDetails?.workTelephone || null,
          role_id: 3, // Default to ผู้ใช้งานระบบ (General User) role
          create_date: new Date(),
          modify_date: new Date(),
        },
        include: {
          role: true,
        },
      });

      user = {
        member_id: newMember.member_id.toString(),
        citizen_id: newMember.citizen_id,
        staff_id: newMember.staff_id,
        email: newMember.email || email,
        title: newMember.title,
        name: newMember.name || userInfo.given_name || '',
        surname: newMember.surname || userInfo.family_name || '',
        phone: newMember.phone,
        username: newMember.username || email,
        role_id: newMember.role_id,
        role: newMember.role,
        create_date: newMember.create_date,
        modify_date: newMember.modify_date,
        delete_date: newMember.delete_date
      };
    }

    // Clear OIDC cookies and return user
    const response = NextResponse.json({
      success: true,
      user,
    });

    // Clear the OIDC state and code verifier cookies
    response.cookies.delete('oidc_state');
    response.cookies.delete('oidc_code_verifier');

    return response;
  } catch (error) {
    console.error('OIDC callback error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to complete authentication',
      },
      { status: 500 }
    );
  }
}
