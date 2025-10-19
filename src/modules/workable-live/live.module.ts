import { Module } from '@nestjs/common';
import { WorkableBondingModule } from '../workable-bonding/workable-bonding.module';
// Import nanti saat workable-spring/foam dibuat:
// import { WorkableSpringModule } from '../workable-spring/workable-spring.module';
// import { WorkableFoamModule } from '../workable-foam/workable-foam.module';
import { LiveService } from './live.service';
import { LiveController } from './live.controller';
import { LiveGateway } from './live.gateway';

@Module({
  imports: [
    WorkableBondingModule,
    // WorkableSpringModule,
    // WorkableFoamModule,
  ],
  controllers: [LiveController],
  providers: [LiveService, LiveGateway],
  exports: [LiveService],
})
export class WorkableLiveModule {}
