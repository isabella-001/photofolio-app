import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
 
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
 
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const message = 'The Vercel Blob storage token is not set. Please connect a store in your Vercel project settings.';
    return NextResponse.json({ error: message }, { status: 500 });
  }

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
    const message = (error as Error).message;
    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
    const { urls } = (await request.json()) as { urls: string[] };

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        const message = 'The Vercel Blob storage token is not set. Please connect a store in your Vercel project settings.';
        return NextResponse.json({ error: message }, { status: 500 });
    }

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: 'Invalid URL list provided.' }, { status: 400 });
    }

    try {
      await del(urls);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error deleting blobs:", error);
      const message = (error as Error).message;
      return NextResponse.json(
        { error: `Failed to delete files: ${message}` },
        { status: 500 },
      );
    }
}
