import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

import { PrismaModule } from './common/prisma/prisma.module';
import { ServicesModule } from './common/services/services.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { VisitsModule } from './modules/visits/visits.module';
import { NotesModule } from './modules/notes/notes.module';
import { PhotosModule } from './modules/photos/photos.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { FilieresModule } from './modules/filieres/filieres.module';
import { LotsModule } from './modules/lots/lots.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
    }),
    PrismaModule,
    ServicesModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    VisitsModule,
    NotesModule,
    PhotosModule,
    UploadsModule,
    FilieresModule,
    LotsModule,
    DashboardModule,
    OpportunitiesModule,
    ProductsModule,
    OrdersModule,
  ],
})
export class AppModule {}
