import { Controller, Get } from '@nestjs/common';
import { SkipAuth } from '../../common/decorators/skip-auth.decorator';
import { LiveService } from './live.service';

@SkipAuth()
@Controller('live-data') // Endpoint: /api/live-data
export class LiveController {
  constructor(private readonly liveService: LiveService) {}

  @Get()
  async getLiveWorkableData() {
    return await this.liveService.getAllWorkableData();
  }
}
