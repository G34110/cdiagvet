import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LotsService } from './lots.service';
import { Lot, LotClient, LotTraceability, ScanResult } from './entities/lot.entity';
import { ScanBarcodeInput, AssociateLotClientInput } from './dto/scan-barcode.input';

@Resolver(() => Lot)
@UseGuards(GqlAuthGuard)
export class LotsResolver {
  private readonly logger = new Logger(LotsResolver.name);

  constructor(private readonly lotsService: LotsService) {}

  @Mutation(() => ScanResult)
  async scanBarcode(
    @Args('input', { type: () => ScanBarcodeInput }) input: ScanBarcodeInput,
  ): Promise<ScanResult> {
    this.logger.log(`Scanning barcode: ${input.barcode}`);
    try {
      const result = await this.lotsService.scanAndCreateLot(input.barcode, input.productName);
      this.logger.log(`Scan result: success=${result.success}, message=${result.message}`);
      return result;
    } catch (error) {
      this.logger.error(`Scan error: ${error.message}`);
      return {
        success: false,
        message: `Erreur serveur: ${error.message}`,
        isNewProduct: false,
      };
    }
  }

  @Mutation(() => LotClient)
  async associateLotToClient(
    @Args('input', { type: () => AssociateLotClientInput }) input: AssociateLotClientInput,
  ): Promise<LotClient> {
    return this.lotsService.associateLotToClient(
      input.lotId,
      input.clientId,
      input.quantity || 1,
      input.deliveryDate,
    );
  }

  @Query(() => LotTraceability)
  async lotTraceability(
    @Args('lotId', { type: () => ID }) lotId: string,
  ): Promise<LotTraceability> {
    return this.lotsService.getLotTraceability(lotId);
  }

  @Query(() => [Lot])
  async searchLots(
    @Args('query') query: string,
    @CurrentUser() user: { tenantId: string },
  ): Promise<Lot[]> {
    return this.lotsService.searchLots(query, user.tenantId);
  }

  @Query(() => [LotClient])
  async clientLots(
    @Args('clientId', { type: () => ID }) clientId: string,
  ): Promise<LotClient[]> {
    return this.lotsService.getClientLots(clientId);
  }

  @Query(() => Lot, { nullable: true })
  async lot(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Lot | null> {
    return this.lotsService.findLotById(id);
  }

  @Query(() => [Lot])
  async allLots(
    @Args('search', { nullable: true }) search?: string,
  ): Promise<Lot[]> {
    return this.lotsService.getAllLots(search);
  }
}
