import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
 
export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'The Vercel Blob storage token (BLOB_READ_WRITE_TOKEN) is not set in the Vercel project settings. Please ensure it is configured correctly and redeploy.' },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as HandleUploadBody;
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
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `The Vercel Blob API returned an error: ${message}` },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json(
            { error: 'The Vercel Blob storage token (BLOB_READ_WRITE_TOKEN) is not set in the Vercel project settings.' },
            { status: 500 }
        );
    }

    try {
      const { urls } = (await request.json()) as { urls: string[] };

      if (!urls || !Array.isArray(urls)) {
        return NextResponse.json({ error: 'Invalid URL list provided.' }, { status: 400 });
      }

      await del(urls);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error deleting blobs:", error);
      const message = error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        { error: `Failed to delete files: ${message}` },
        { status: 500 },
      );
    }
}
