import { ObjectType, Field, ID, Float, Int, registerEnumType } from '@nestjs/graphql';

export enum OpportunityStatus {
  NOUVEAU = 'NOUVEAU',
  QUALIFICATION = 'QUALIFICATION',
  PROPOSITION = 'PROPOSITION',
  NEGOCIATION = 'NEGOCIATION',
  GAGNE = 'GAGNE',
  PERDU = 'PERDU',
}

export enum OpportunitySource {
  SALON = 'SALON',
  APPEL_ENTRANT = 'APPEL_ENTRANT',
  RECOMMANDATION = 'RECOMMANDATION',
  SITE_WEB = 'SITE_WEB',
  AUTRE = 'AUTRE',
}

registerEnumType(OpportunityStatus, { name: 'OpportunityStatus' });
registerEnumType(OpportunitySource, { name: 'OpportunitySource' });

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
