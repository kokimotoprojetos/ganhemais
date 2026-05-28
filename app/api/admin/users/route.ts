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

    let profiles: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let keepFetching = true;

    while (keepFetching) {
      const { data: chunk, error } = await adminSupabase
        .from('profiles')
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) throw error;
      profiles = [...profiles, ...chunk];
      
      if (chunk.length < pageSize) {
        keepFetching = false;
      } else {
        page++;
      }
    }

    const client = await clerkClient();
    let clerkUsersData: any[] = [];
    let limit = 500;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await client.users.getUserList({ limit, offset });
      clerkUsersData = [...clerkUsersData, ...response.data];
      if (response.data.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }
    
    const merged = profiles.map(profile => {
      const clerkUser = clerkUsersData.find(u => u.id === profile.id);
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
        invite_bonus: publicMetadata.invite_bonus !== undefined ? Number(publicMetadata.invite_bonus) : 1.00,
        app_downloaded: publicMetadata.app_downloaded === true,
        app_download_clicks: Number(publicMetadata.app_download_clicks || 0),
        plan: profile.plan,
        last_active_at: lastActive,
        is_online: isOnline,
        invites,
        withdrawals: unsafeMetadata.withdrawals || [],
        deposit_balance: unsafeMetadata.deposit_balance !== undefined ? Number(unsafeMetadata.deposit_balance) : 0,
        bonus_balance: unsafeMetadata.bonus_balance !== undefined ? Number(unsafeMetadata.bonus_balance) : 0
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
    const { id, balance, invite_bonus, app_downloaded, plan, withdrawals, deposit_balance, bonus_balance } = await req.json();

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
      },
      unsafeMetadata: {}
    };
    if (withdrawals !== undefined) {
      updateMetadata.unsafeMetadata.withdrawals = withdrawals;
    }
    if (deposit_balance !== undefined) {
      updateMetadata.unsafeMetadata.deposit_balance = Number(deposit_balance);
    }
    if (bonus_balance !== undefined) {
      updateMetadata.unsafeMetadata.bonus_balance = Number(bonus_balance);
    }
    await client.users.updateUserMetadata(id, updateMetadata);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
