import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
 
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
 
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          tokenPayload: JSON.stringify({
            // optional, sent to your server on upload completion
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // console.log('blob upload completed', blob, tokenPayload);
      },
    });
 
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
    const { urls } = (await request.json()) as { urls: string[] };

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: 'Invalid URL list provided.' }, { status: 400 });
    }

    try {
      await del(urls);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error deleting blobs:", error);
      return NextResponse.json(
        { error: 'Failed to delete files.' },
        { status: 500 },
      );
    }
}
