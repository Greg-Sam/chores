import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Chore, { calculateNextDueDate, FREQUENCY_VALUES } from '@/models/Chore';
import type { Frequency } from '@/models/Chore';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, userId, assignedTo, name, description, frequency, dueDate } = body;

    await connectDB();

    const chore = await Chore.findById(id);
    if (!chore) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 });
    }

    // --- Complete a chore ---
    if (action === 'complete') {
      if (!userId) {
        return NextResponse.json({ error: 'userId is required to complete a chore' }, { status: 400 });
      }

      const completedAt = new Date();
      chore.completedDate = completedAt;
      chore.dueDate = calculateNextDueDate(completedAt, chore.frequency);
      chore.history.push({ completedAt, completedBy: userId });
      chore.assignedTo = null;

      await chore.save();
      return NextResponse.json(chore);
    }

    // --- Assign a chore ---
    if (action === 'assign') {
      chore.assignedTo = assignedTo ?? null;
      await chore.save();
      return NextResponse.json(chore);
    }

    // --- Edit chore fields ---
    if (action === 'edit') {
      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim() === '') {
          return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
        }
        chore.name = name.trim();
      }

      if (description !== undefined) {
        if (typeof description !== 'string' || description.trim() === '') {
          return NextResponse.json({ error: 'Description cannot be empty' }, { status: 400 });
        }
        chore.description = description.trim();
      }

      if (frequency !== undefined) {
        if (!FREQUENCY_VALUES.includes(frequency as Frequency)) {
          return NextResponse.json(
            { error: `Frequency must be one of: ${FREQUENCY_VALUES.join(', ')}` },
            { status: 400 }
          );
        }
        chore.frequency = frequency;
      }

      if (dueDate !== undefined) {
        if (isNaN(Date.parse(dueDate))) {
          return NextResponse.json({ error: 'Invalid dueDate' }, { status: 400 });
        }
        chore.dueDate = new Date(dueDate);
      }

      await chore.save();
      return NextResponse.json(chore);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('PATCH /actions/chores/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update chore' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    await connectDB();

    const chore = await Chore.findByIdAndDelete(id);
    if (!chore) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Chore deleted' });
  } catch (error) {
    console.error('DELETE /actions/chores/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete chore' }, { status: 500 });
  }
}
