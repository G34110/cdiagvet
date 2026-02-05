import {
  Controller,
  Post,
  Get,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ClientsService } from './clients.service';

interface ImportResult {
  success: number;
  errors: { line: number; error: string }[];
}

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ): Promise<ImportResult> {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (ext !== 'csv') {
      throw new BadRequestException('Format de fichier non supporté. Utilisez un fichier .csv');
    }

    const content = file.buffer.toString('utf-8');
    const lines = content.split(/\r?\n/).filter(line => line.trim());

    if (lines.length < 2) {
      throw new BadRequestException('Le fichier doit contenir au moins une ligne d\'en-tête et une ligne de données');
    }

    const tenantId = req.user.tenantId;
    const commercialId = req.user.id;

    // Skip header line
    const dataLines = lines.slice(1);
    const result: ImportResult = { success: 0, errors: [] };

    for (let i = 0; i < dataLines.length; i++) {
      const lineNumber = i + 2; // +2 because of 0-index and header
      const line = dataLines[i];

      try {
        const fields = line.split(';').map(f => f.trim());

        if (fields.length < 6) {
          result.errors.push({ line: lineNumber, error: 'Nombre de colonnes insuffisant (minimum 6)' });
          continue;
        }

        const [name, address, city, postalCode, phone, email, filieresStr] = fields;

        if (!name) {
          result.errors.push({ line: lineNumber, error: 'Le nom est obligatoire' });
          continue;
        }

        if (!email) {
          result.errors.push({ line: lineNumber, error: 'L\'email est obligatoire' });
          continue;
        }

        // Parse filières
        let filiereIds: string[] = [];
        if (filieresStr) {
          const filiereNames = filieresStr.split(',').map(f => f.trim()).filter(Boolean);
          filiereIds = await this.clientsService.getFiliereIdsByNames(filiereNames, tenantId);
        }

        await this.clientsService.create(
          {
            name,
            address: address || undefined,
            city: city || undefined,
            postalCode: postalCode || undefined,
            phone: phone || undefined,
            email,
            filiereIds: filiereIds.length > 0 ? filiereIds : undefined,
          },
          tenantId,
          commercialId,
        );

        result.success++;
      } catch (error: any) {
        result.errors.push({ line: lineNumber, error: error.message || 'Erreur inconnue' });
      }
    }

    return result;
  }

  @Get('export')
  async exportClients(
    @Query('format') format: string = 'csv',
    @Query('filiereIds') filiereIds: string,
    @Query('isActive') isActive: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const tenantId = req.user.tenantId;
    
    // Build filter
    const filter: any = {};
    if (filiereIds) {
      filter.filiereIds = filiereIds.split(',');
    }
    if (isActive !== undefined && isActive !== '') {
      filter.isActive = isActive === 'true';
    }

    // Get clients based on user role
    let clients: any[];
    if (req.user.role === 'ADMIN') {
      // Admin can export all clients
      const result = await this.clientsService.findAll(tenantId, filter);
      clients = result.clients;
    } else {
      // Commercial exports only their clients
      clients = await this.clientsService.findByCommercial(req.user.id, filter);
    }

    if (format === 'json') {
      const jsonData = clients.map((c: any) => ({
        name: c.name,
        address: c.address || '',
        city: c.city || '',
        postalCode: c.postalCode || '',
        phone: c.phone || '',
        email: c.email || '',
        filieres: c.filieres?.map((f: any) => f.name).join(',') || '',
        isActive: c.isActive,
        latitude: c.latitude || '',
        longitude: c.longitude || '',
      }));

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=clients.json');
      return res.send(JSON.stringify(jsonData, null, 2));
    }

    // Default: CSV format
    const header = 'name;address;city;postalCode;phone;email;filieres;isActive;latitude;longitude';
    const rows = clients.map((c: any) => {
      const filiereNames = c.filieres?.map((f: any) => f.name).join(',') || '';
      return [
        c.name || '',
        c.address || '',
        c.city || '',
        c.postalCode || '',
        c.phone || '',
        c.email || '',
        filiereNames,
        c.isActive ? 'true' : 'false',
        c.latitude || '',
        c.longitude || '',
      ].join(';');
    });

    const csvContent = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=clients.csv');
    return res.send('\uFEFF' + csvContent); // BOM for Excel UTF-8
  }
}
