import { type NextRequest, NextResponse } from 'next/server';
import { createContactService } from '@/services';
import { CreateContactDetailSchema, formatZodError } from '@/lib/schemas';
import { requireAuth, isAuthError } from '@/lib/auth';

const contactService = createContactService();

export async function GET() {
  try {
    const list = await contactService.getAllDetails();
    if (list.isFailure()) {
      throw list.error;
    }
    return NextResponse.json(list.data);
  } catch (e) {
    console.error('GET /api/contact_details error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const parsed = CreateContactDetailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error.issues) }, { status: 400 });
    }
    const created = await contactService.createDetail({
      type: parsed.data.type,
      value: parsed.data.value,
      group_id: parsed.data.group_id,
      order_position: parsed.data.order_position,
    });
    if (created.isFailure()) {
      throw created.error;
    }
    return NextResponse.json(created.data, { status: 201 });
  } catch (e) {
    console.error('POST /api/contact_details error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
