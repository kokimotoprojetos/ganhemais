import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_TOKEN = 'admin_replio_2026_secreto';

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase admin credentials missing');
    }
    
    const adminSupabase = createClient(supabaseUrl, supabaseKey);

    const { data: profiles, error } = await adminSupabase.from('profiles').select('*');
    if (error) throw error;

    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({ limit: 500 });
    
    const merged = profiles.map(profile => {
      const clerkUser = clerkUsers.data.find(u => u.id === profile.id);
      const publicMetadata = clerkUser?.publicMetadata || {};
      const unsafeMetadata = clerkUser?.unsafeMetadata || {};
      
      const lastActive = clerkUser?.lastActiveAt
        ? (typeof clerkUser.lastActiveAt === 'number'
            ? clerkUser.lastActiveAt
            : new Date(clerkUser.lastActiveAt).getTime())
        : 0;
      const isOnline = lastActive > 0 && (Date.now() - lastActive < 5 * 60 * 1000); // 5 min

      const invites = profiles.filter(p => p.invited_by === profile.id).length;

      return {
        id: profile.id,
        email: profile.email,
        balance: Number(profile.balance || 0),
        total_earned: Number(profile.total_earned || 0),
        invite_bonus: publicMetadata.invite_bonus !== undefined ? Number(publicMetadata.invite_bonus) : 0.50,
        app_downloaded: publicMetadata.app_downloaded === true,
        app_download_clicks: Number(publicMetadata.app_download_clicks || 0),
        plan: profile.plan,
        last_active_at: lastActive,
        is_online: isOnline,
        invites,
        withdrawals: unsafeMetadata.withdrawals || []
      };
    });

    return NextResponse.json({ users: merged });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, balance, invite_bonus, app_downloaded, plan, withdrawals } = await req.json();

    if (!id) throw new Error('User ID is required');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminSupabase = createClient(supabaseUrl!, supabaseKey!);

    // Update Supabase if balance or plan changed
    const updateFields: Record<string, any> = {};
    if (balance !== undefined) updateFields.balance = Number(balance);
    if (plan !== undefined) updateFields.plan = plan;

    if (Object.keys(updateFields).length > 0) {
      const { error } = await adminSupabase
        .from('profiles')
        .update(updateFields)
        .eq('id', id);
      if (error) throw error;
    }

    // Update Clerk Metadata
    const client = await clerkClient();
    const updateMetadata: Record<string, any> = {
      publicMetadata: {
        invite_bonus: Number(invite_bonus),
        app_downloaded: Boolean(app_downloaded)
      }
    };
    if (withdrawals !== undefined) {
      updateMetadata.unsafeMetadata = {
        withdrawals: withdrawals
      };
    }
    await client.users.updateUserMetadata(id, updateMetadata);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
