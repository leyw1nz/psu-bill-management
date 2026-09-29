import { NextRequest, NextResponse } from 'next/server';
import { fetchOIDCMetadata } from '@/lib/oidc';

export async function POST(request: NextRequest) {
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

    // Get the base URL for post-logout redirect URI
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'localhost:3000';
    const postLogoutRedirectUri = `${protocol}://${host}/login`;

    // Build the logout URL
    let logoutUrl = '';
    if (metadata.end_session_endpoint) {
      const params = new URLSearchParams({
        post_logout_redirect_uri: postLogoutRedirectUri,
        client_id: clientId,
      });
      logoutUrl = `${metadata.end_session_endpoint}?${params.toString()}`;
    }

    // Clear session cookies
    const response = NextResponse.json({
      success: true,
      logoutUrl: logoutUrl || null,
    });

    // Clear OIDC cookies if they exist
    response.cookies.delete('oidc_state');
    response.cookies.delete('oidc_code_verifier');

    return response;
  } catch (error) {
    console.error('OIDC logout error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to initiate logout',
      },
      { status: 500 }
    );
  }
}
