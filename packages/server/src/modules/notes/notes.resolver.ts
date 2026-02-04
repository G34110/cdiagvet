import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotesService } from './notes.service';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Note } from './entities/note.entity';
import { CreateNoteInput } from './dto/create-note.input';
import { UpdateNoteInput } from './dto/update-note.input';

@Resolver(() => Note)
export class NotesResolver {
  constructor(private notesService: NotesService) {}

  @Mutation(() => Note)
  @UseGuards(GqlAuthGuard)
  async createNote(
    @Args('input') input: CreateNoteInput,
    @CurrentUser() user: { id: string },
  ) {
    return this.notesService.create(input, user.id);
  }

  @Mutation(() => Note)
  @UseGuards(GqlAuthGuard)
  async updateNote(
    @Args('id', { type: () => String }) id: string,
    @Args('input') input: UpdateNoteInput,
    @CurrentUser() user: { id: string },
  ) {
    return this.notesService.update(id, user.id, input);
  }

  @Mutation(() => Note)
  @UseGuards(GqlAuthGuard)
  async deleteNote(
    @Args('id', { type: () => String }) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.notesService.delete(id, user.id);
  }

  @Query(() => [Note])
  @UseGuards(GqlAuthGuard)
  async clientNotes(
    @Args('clientId', { type: () => String }) clientId: string,
  ) {
    return this.notesService.findByClient(clientId);
  }

  @Query(() => Note)
  @UseGuards(GqlAuthGuard)
  async note(@Args('id', { type: () => String }) id: string) {
    return this.notesService.findById(id);
  }
}
