import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Contact } from './entities/contact.entity';
import { CreateContactInput } from './dto/create-contact.input';
import { UpdateContactInput } from './dto/update-contact.input';

@Resolver(() => Contact)
export class ContactsResolver {
  constructor(private contactsService: ContactsService) {}

  @Mutation(() => Contact)
  @UseGuards(GqlAuthGuard)
  async createContact(
    @Args('input') input: CreateContactInput,
    @CurrentUser() user: { id: string },
  ) {
    return this.contactsService.create(input, user.id);
  }

  @Mutation(() => Contact)
  @UseGuards(GqlAuthGuard)
  async updateContact(
    @Args('id', { type: () => String }) id: string,
    @Args('input') input: UpdateContactInput,
    @CurrentUser() user: { id: string },
  ) {
    return this.contactsService.update(id, user.id, input);
  }

  @Mutation(() => Contact)
  @UseGuards(GqlAuthGuard)
  async deleteContact(
    @Args('id', { type: () => String }) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.contactsService.delete(id, user.id);
  }

  @Query(() => [Contact])
  @UseGuards(GqlAuthGuard)
  async clientContacts(
    @Args('clientId', { type: () => String }) clientId: string,
  ) {
    return this.contactsService.findByClient(clientId);
  }

  @Query(() => [Contact])
  @UseGuards(GqlAuthGuard)
  async myContacts(@CurrentUser() user: { id: string }) {
    return this.contactsService.findMyContacts(user.id);
  }

  @Query(() => Contact, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async contact(@Args('id', { type: () => String }) id: string) {
    return this.contactsService.findById(id);
  }
}
