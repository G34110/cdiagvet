import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PhotosService } from './photos.service';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Photo } from './entities/photo.entity';
import { CreatePhotoInput } from './dto/create-photo.input';

@Resolver(() => Photo)
export class PhotosResolver {
  constructor(private photosService: PhotosService) {}

  @Mutation(() => Photo)
  @UseGuards(GqlAuthGuard)
  async createPhoto(
    @Args('input') input: CreatePhotoInput,
    @CurrentUser() user: { id: string },
  ) {
    return this.photosService.create(input, user.id);
  }

  @Mutation(() => Photo)
  @UseGuards(GqlAuthGuard)
  async deletePhoto(
    @Args('id', { type: () => String }) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.photosService.delete(id, user.id);
  }

  @Query(() => [Photo])
  @UseGuards(GqlAuthGuard)
  async visitPhotos(
    @Args('visitId', { type: () => String }) visitId: string,
  ) {
    return this.photosService.findByVisit(visitId);
  }

  @Query(() => [Photo])
  @UseGuards(GqlAuthGuard)
  async clientPhotos(
    @Args('clientId', { type: () => String }) clientId: string,
  ) {
    return this.photosService.findByClient(clientId);
  }
}
