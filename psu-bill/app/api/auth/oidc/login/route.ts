import { NextRequest, NextResponse } from 'next/server';
import {
  fetchOIDCMetadata,
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthorizationUrl,
} from '@/lib/oidc';

export async function GET(request: NextRequest) {
  try {
    // Get OIDC configuration from environment variables
    const clientId = process.env.OIDC_APP_ID;
    const metadataUrl = process.env.OIDC_METADATA_URL;

    if (!clientId || !metadataUrl) {
      return NextResponse.json(
        { error: 'OIDC configuration is missing' },
        { status: 500 }
      );
    }

    // Fetch OIDC provider metadata
    const metadata = await fetchOIDCMetadata(metadataUrl);

    // Generate state and PKCE parameters
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Get the base URL for redirect URI
    // Force HTTPS in production
    const protocol = process.env.NODE_ENV === 'production'
      ? 'https'
      : (request.headers.get('x-forwarded-proto') || 'http');
    const host = request.headers.get('host') || 'localhost:3000';
    const redirectUri = `${protocol}://${host}/auth/callback`;

    // Build authorization URL
    const authUrl = buildAuthorizationUrl(metadata.authorization_endpoint, {
      clientId,
      redirectUri,
      scope: 'openid profile email',
      state,
      codeChallenge,
    });

    // Store state and code verifier in cookies for verification
    const response = NextResponse.redirect(authUrl);

    // Set cookies with state and code verifier (expires in 10 minutes)
    response.cookies.set('oidc_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    response.cookies.set('oidc_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OIDC login initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OIDC login' },
      { status: 500 }
    );
  }
}
