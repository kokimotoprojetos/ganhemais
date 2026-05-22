import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    const currentClicks = Number(user.publicMetadata?.app_download_clicks || 0);
    const newClicks = currentClicks + 1;

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        app_download_clicks: newClicks,
        app_downloaded: true
      }
    });

    return NextResponse.json({ success: true, clicks: newClicks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
