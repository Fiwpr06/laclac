import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OutboxEventDocument = OutboxEvent & Document;

@Schema({ timestamps: true, collection: 'outbox_events' })
export class OutboxEvent {
  @Prop({ required: true, unique: true })
  eventId!: string;

  @Prop({ required: true })
  eventType!: string;

  @Prop({ type: Object, required: true })
  payload!: Record<string, any>;

  @Prop({ required: true, enum: ['PENDING', 'PROCESSED', 'FAILED'], default: 'PENDING' })
  status!: string;

  @Prop()
  error?: string;
}

export const OutboxEventSchema = SchemaFactory.createForClass(OutboxEvent);
