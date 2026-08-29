import { type NextRequest, NextResponse } from 'next/server';
import { createDoctorService, type UpdateDoctorRequest } from '@/services';
import { requireAuth, isAuthError } from '@/lib/auth';
import { NotFoundError } from '@/domain';

const doctorService = createDoctorService();

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const result = await doctorService.getDoctorById(id);
    if (result.isFailure()) {
      if (result.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw result.error;
    }
    return NextResponse.json(result.data);
  } catch (e: any) {
    console.error('GET /api/doctors/:id error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = params;
    const body = await request.json();

    const updateData: UpdateDoctorRequest = {};
    if (body.first_name !== undefined) updateData.first_name = body.first_name;
    if (body.last_name !== undefined) updateData.last_name = body.last_name;
    if (body.specialization !== undefined) updateData.specialization = body.specialization;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.description !== undefined && updateData.bio === undefined) {
      updateData.bio = body.description;
    }
    if (body.image_url !== undefined) updateData.image_url = body.image_url;
    if (body.schedule !== undefined) updateData.schedule = body.schedule;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.order_position !== undefined) updateData.order_position = body.order_position;

    const result = await doctorService.updateDoctor(id, updateData);
    if (result.isFailure()) {
      if (result.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw result.error;
    }
    return NextResponse.json(result.data);
  } catch (e: any) {
    console.error('PATCH /api/doctors/:id error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = params;
    const result = await doctorService.deleteDoctor(id);
    if (result.isFailure()) {
      if (result.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw result.error;
    }
    return NextResponse.json({ message: 'Doctor deleted successfully' });
  } catch (e: any) {
    console.error('DELETE /api/doctors/:id error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
