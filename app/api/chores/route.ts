import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Chore, { FREQUENCY_VALUES } from '@/models/Chore';
import type { Frequency } from '@/models/Chore';

export async function GET() {
  try {
    await connectDB();
    const chores = await Chore.find({})
      .populate('assignedTo', 'name')
      .sort({ dueDate: 1 })
      .lean();
    return NextResponse.json(chores);
  } catch (error) {
    console.error('GET /actions/chores error:', error);
    return NextResponse.json({ error: 'Failed to fetch chores' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, frequency, dueDate, assignedTo } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!FREQUENCY_VALUES.includes(frequency as Frequency)) {
      return NextResponse.json(
        { error: `Frequency must be one of: ${FREQUENCY_VALUES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!dueDate || isNaN(Date.parse(dueDate))) {
      return NextResponse.json({ error: 'A valid dueDate is required' }, { status: 400 });
    }

    await connectDB();

    const chore = await Chore.create({
      name: name.trim(),
      description: description?.trim() ?? '',
      frequency,
      dueDate: new Date(dueDate),
      assignedTo: assignedTo ?? null,
      status: 'active',
    });

    return NextResponse.json(chore, { status: 201 });
  } catch (error) {
    console.error('POST /actions/chores error:', error);
    return NextResponse.json({ error: 'Failed to create chore' }, { status: 500 });
  }
}
