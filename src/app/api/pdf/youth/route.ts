import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateYouthApplication } from '@/lib/pdf/bsa';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!userData || !['admin', 'superadmin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const body = await request.json();
    const { youth_id } = body;
    
    if (!youth_id) {
      return NextResponse.json({ error: 'youth_id required' }, { status: 400 });
    }
    
    const { data: youth } = await supabase
      .from('youth_members')
      .select('*, household:households(*)')
      .eq('id', youth_id)
      .single();
    
    if (!youth) {
      return NextResponse.json({ error: 'Youth member not found' }, { status: 404 });
    }
    
    const { data: parents } = await supabase
      .from('users')
      .select('*')
      .eq('household_id', youth.household_id)
      .eq('role', 'parent')
      .limit(1);
    
    const parent = parents?.[0];
    
    const youthData = {
      unitType: 'Troop',
      unitNumber: '123',
      councilName: 'Pathfinder Council',
      district: 'District',
      firstName: youth.first_name,
      middleName: '',
      lastName: youth.last_name,
      suffix: '',
      nickname: youth.preferred_name || '',
      gender: youth.gender || '',
      dateOfBirth: youth.dob,
      grade: youth.grade || 0,
      school: youth.school_name || '',
      country: 'USA',
      addressLine1: youth.household?.address_line1 || '',
      addressLine2: youth.household?.address_line2 || '',
      city: youth.household?.city || '',
      state: youth.household?.state || '',
      zipCode: youth.household?.zip || '',
      phone: parent?.phone || '',
      parentName: parent ? parent.first_name + ' ' + parent.last_name : '',
      parentRelationship: parent?.relationship || '',
      parentDOB: '',
      parentOccupation: '',
      parentEmployer: '',
      parentEmail: parent?.email || '',
      parentPhone: parent?.phone || '',
      previousScouting: false,
      signature: '',
      signatureDate: new Date().toLocaleDateString(),
    };
    
    const pdfBytes = await generateYouthApplication(youthData);
    const filename = youth.first_name + '_' + youth.last_name + '_BSA_Application.pdf';
    
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=' + filename,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
