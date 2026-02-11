import { ObjectType, Field, ID, Float, Int, registerEnumType } from '@nestjs/graphql';

export enum OpportunityStatus {
  NOUVEAU = 'NOUVEAU',
  QUALIFICATION = 'QUALIFICATION',
  PROPOSITION = 'PROPOSITION',
  NEGOCIATION = 'NEGOCIATION',
  GAGNE = 'GAGNE',
  CONVERTI = 'CONVERTI',
  PERDU = 'PERDU',
}

export enum OpportunitySource {
  SALON = 'SALON',
  APPEL_ENTRANT = 'APPEL_ENTRANT',
  RECOMMANDATION = 'RECOMMANDATION',
  SITE_WEB = 'SITE_WEB',
  AUTRE = 'AUTRE',
}

export enum OpportunityEventType {
  STATUS_CHANGE = 'STATUS_CHANGE',
  NOTE_ADDED = 'NOTE_ADDED',
  OWNER_CHANGE = 'OWNER_CHANGE',
  AMOUNT_CHANGE = 'AMOUNT_CHANGE',
  LINE_ADDED = 'LINE_ADDED',
  LINE_REMOVED = 'LINE_REMOVED',
  LINE_UPDATED = 'LINE_UPDATED',
  DOCUMENT_ATTACHED = 'DOCUMENT_ATTACHED',
  RDV_SCHEDULED = 'RDV_SCHEDULED',
  EMAIL_SENT = 'EMAIL_SENT',
  CREATED = 'CREATED',
}

registerEnumType(OpportunityStatus, { name: 'OpportunityStatus' });
registerEnumType(OpportunitySource, { name: 'OpportunitySource' });
registerEnumType(OpportunityEventType, { name: 'OpportunityEventType' });

@ObjectType()
export class OpportunityLine {
  @Field(() => ID)
  id: string;

  @Field()
  productName: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  total: number;

  @Field({ nullable: true })
  productId?: string;

  @Field({ nullable: true })
  kitId?: string;
}

@ObjectType()
export class OpportunityOwner {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;
}

@ObjectType()
export class CommercialUser {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;
}

@ObjectType()
export class OpportunityClient {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  organization?: string;
}

@ObjectType()
export class Opportunity {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  contactName: string;

  @Field({ nullable: true })
  contactEmail?: string;

  @Field({ nullable: true })
  contactPhone?: string;

  @Field(() => OpportunitySource)
  source: OpportunitySource;

  @Field(() => Float)
  amount: number;

  @Field(() => Float, { nullable: true })
  manualAmount?: number;

  @Field(() => Int)
  probability: number;

  @Field()
  expectedCloseDate: Date;

  @Field(() => OpportunityStatus)
  status: OpportunityStatus;

  @Field({ nullable: true })
  lostReason?: string;

  @Field({ nullable: true })
  lostComment?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => OpportunityClient)
  client: OpportunityClient;

  @Field(() => OpportunityOwner)
  owner: OpportunityOwner;

  @Field(() => [OpportunityLine])
  lines: OpportunityLine[];

  @Field(() => Float)
  weightedAmount: number;
}

@ObjectType()
export class OpportunityEventUser {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;
}

@ObjectType()
export class OpportunityEvent {
  @Field(() => ID)
  id: string;

  @Field(() => OpportunityEventType)
  type: OpportunityEventType;

  @Field({ nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  metadata?: string;

  @Field()
  createdAt: Date;

  @Field(() => OpportunityEventUser, { nullable: true })
  user?: OpportunityEventUser;
}

@ObjectType()
export class OpportunityNote {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => OpportunityEventUser)
  author: OpportunityEventUser;
}

@ObjectType()
export class OpportunityTimeline {
  @Field(() => [OpportunityEvent])
  events: OpportunityEvent[];

  @Field(() => [OpportunityNote])
  notes: OpportunityNote[];
}
