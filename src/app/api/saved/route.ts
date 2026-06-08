import { NextRequest, NextResponse } from 'next/server';
import { getSavedStartups, saveStartup, deleteStartup } from '@/lib/db';

export async function GET() {
  try {
    const saved = getSavedStartups();
    return NextResponse.json({ data: saved });
  } catch (error: any) {
    console.error('Failed to get saved startups:', error);
    return NextResponse.json({ error: 'Failed to retrieve saved startups' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !body.slug || !body.name) {
      return NextResponse.json({ error: 'Invalid startup object. Name and slug are required.' }, { status: 400 });
    }
    const updated = saveStartup(body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Failed to save startup:', error);
    return NextResponse.json({ error: 'Failed to save startup' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }
    const updated = deleteStartup(slug);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Failed to delete startup:', error);
    return NextResponse.json({ error: 'Failed to delete startup' }, { status: 500 });
  }
}
