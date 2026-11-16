import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  try {
    const [projectsRes, logsRes] = await Promise.all([
      supabase
        .from('projects')
        .select('*, client:clients(*), project_manager:profiles(*)')
        .order('created_at', { ascending: false }),
      supabase
        .from('project_progress_logs')
        .select('*, technician:profiles(*), site:sites(*)')
        .order('created_at', { ascending: false }),
    ]);

    let projects = projectsRes.data || [];
    if (projectsRes.error) {
      const fallback = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      projects = fallback.data || [];
    }

    let logs = logsRes.data || [];
    if (logsRes.error) {
      const fallback = await supabase.from('project_progress_logs').select('*').order('created_at', { ascending: false });
      logs = fallback.data || [];
    }

    return NextResponse.json({
      projects,
      logs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const supabase = createAdminClient();
  try {
    const body = await req.json();
    const {
      projectId,
      siteId,
      technicianId,
      volumeRealized,
      description,
      photoBeforeUrl,
      photoProgressUrl,
      photoAfterUrl,
      hasIssues,
      issueDescription,
    } = body;

    const payload = {
      project_id: projectId,
      site_id: siteId || null,
      technician_id:
        technicianId && technicianId.length === 36
          ? technicianId
          : 'a0000000-0000-0000-0000-000000000006',
      log_date: new Date().toISOString().slice(0, 10),
      volume_realized: volumeRealized || 0,
      description: description || 'Progres harian lapangan',
      photo_before_url: photoBeforeUrl || null,
      photo_progress_url: photoProgressUrl || null,
      photo_after_url: photoAfterUrl || null,
      has_issues: !!hasIssues,
      issue_description: issueDescription || null,
    };

    let { data, error } = await supabase
      .from('project_progress_logs')
      .insert(payload)
      .select('*, technician:profiles(*), site:sites(*)')
      .single();

    if (error) {
      console.warn('POST progress log join failed, fallback raw insert:', error.message);
      const rawRes = await supabase
        .from('project_progress_logs')
        .insert(payload)
        .select('*')
        .single();
      data = rawRes.data;
      error = rawRes.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
