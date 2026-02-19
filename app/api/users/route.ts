import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    const users = await User.find({}).lean();
    return NextResponse.json(users);
  } catch (error) {
    console.error('GET /actions/users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.create({ name: name.trim() });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('POST /actions/users error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
