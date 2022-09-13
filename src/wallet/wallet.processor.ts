import { OnQueueActive, OnQueueCompleted, OnQueueStalled, Process, Processor } from '@nestjs/bull';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Job } from 'bull';
import { WalletTypeTransaction } from 'src/protobuf/interface-ts/enums';

@Processor('wallet')
export class PaymentProcessor implements OnModuleInit {
  private readonly logger = new Logger(PaymentProcessor.name);
  onModuleInit() {
    this.logger.debug('PaymentProcessor initialized');
  }
  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}...`);
  }

  @OnQueueStalled()
  onGlobalQueueStalled(job: Job) {
    this.logger.debug(`Stalled job ${job.id} of type ${job.name}...`);
  }

  @OnQueueCompleted()
  onQueueCompleted(job: Job) {
    this.logger.debug(`Completed job ${job.id} of type ${job.name}...`);
  }

  @Process(WalletTypeTransaction.DEPOSIT)
  async depositWallet(job: Job) {
    console.log('job :>> ', job);
  }
}
