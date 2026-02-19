import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// --- Enums ---

export const FREQUENCY_VALUES = [
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'annually',
] as const;

export type Frequency = (typeof FREQUENCY_VALUES)[number];

export const STATUS_VALUES = ['active', 'queued'] as const;
export type ChoreStatus = (typeof STATUS_VALUES)[number];

export const FREQUENCY_DAYS: Record<Frequency, number> = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 90,
  annually: 365,
};

export function calculateNextDueDate(
  completedAt: Date,
  frequency: Frequency
): Date {
  const days = FREQUENCY_DAYS[frequency];
  const next = new Date(completedAt);
  next.setDate(next.getDate() + days);
  return next;
}

// --- History entry ---

export interface IChoreHistoryEntry {
  completedAt: Date;
  completedBy: Types.ObjectId;
}

// --- Chore ---

export interface IChore {
  name: string;
  description: string;
  frequency: Frequency;
  assignedTo: Types.ObjectId | null;
  status: ChoreStatus;
  dueDate: Date;
  completedDate: Date | null;
  history: IChoreHistoryEntry[];
}

export type ChoreDocument = IChore & Document;

// --- Sub-schema ---

const ChoreHistoryEntrySchema = new Schema<IChoreHistoryEntry>(
  {
    completedAt: {
      type: Date,
      required: true,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { _id: false }
);

// --- Main schema ---

const ChoreSchema = new Schema<ChoreDocument>(
  {
    name: {
      type: String,
      required: [true, 'Chore name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Chore description is required'],
      trim: true,
    },
    frequency: {
      type: String,
      enum: FREQUENCY_VALUES,
      required: [true, 'Frequency is required'],
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: STATUS_VALUES,
      required: [true, 'Status is required'],
      default: 'active',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    completedDate: {
      type: Date,
      default: null,
    },
    history: {
      type: [ChoreHistoryEntrySchema],
      default: [],
    },
  },
  { timestamps: false }
);

const Chore: Model<ChoreDocument> =
  mongoose.models.Chore ?? mongoose.model<ChoreDocument>('Chore', ChoreSchema);

export default Chore;
