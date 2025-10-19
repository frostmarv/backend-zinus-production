import { Injectable } from '@nestjs/common';
import { WorkableBondingService } from '../workable-bonding/workable-bonding.service';

@Injectable()
export class LiveService {
  constructor(
    private readonly workableBondingService: WorkableBondingService,
    // nanti tambahkan:
    // private readonly workableSpringService: WorkableSpringService,
    // private readonly workableFoamService: WorkableFoamService,
  ) {}

  async getAllWorkableData() {
    // Ambil data dari semua workable service
    const bonding = {
      bonding: await this.workableBondingService.getWorkableBonding(),
      detail: await this.workableBondingService.getWorkableDetail(),
      ng: await this.workableBondingService.getWorkableReject(),
    };

    // Nanti saat module lain dibuat, tambahkan di sini:
    // const spring = {
    //   bonding: await this.workableSpringService.getWorkableBonding(),
    //   detail: await this.workableSpringService.getWorkableDetail(),
    //   ng: await this.workableSpringService.getWorkableReject(),
    // };

    // const foam = {
    //   bonding: await this.workableFoamService.getWorkableBonding(),
    //   detail: await this.workableFoamService.getWorkableDetail(),
    //   ng: await this.workableFoamService.getWorkableReject(),
    // };

    // Untuk sekarang, spring & foam kosong
    const spring = { bonding: [], detail: [], ng: [] };
    const foam = { bonding: [], detail: [], ng: [] };

    return {
      timestamp: new Date().toISOString(),
      bonding,
      spring,
      foam,
    };
  }
}
