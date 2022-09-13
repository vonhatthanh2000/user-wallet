import { OnQueueActive, OnQueueCompleted, OnQueueStalled, Process, Processor } from '@nestjs/bull';
import { BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { Job } from 'bull';
import { ETransactionStatus, WalletTypeTransaction } from 'src/protobuf/interface-ts/enums';
import { TransactionService } from 'src/transaction/transaction.service';
import { WalletService } from './wallet.service';

@Processor('wallet')
export class PaymentProcessor implements OnModuleInit {
  private readonly logger = new Logger(PaymentProcessor.name);
  constructor(private readonly transactionService: TransactionService, private readonly walletService: WalletService) {}
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
    this.logger.debug(`Handle Event ${WalletTypeTransaction.DEPOSIT}`);
    await this.transactionService.updateTransactionById(job.data.transactionId, {
      status: ETransactionStatus.PROCESSING,
    });

    try {
      const currentBalance = await this.walletService.getBalance(job.data.walletId);
      const newBalance = currentBalance + job.data.amount;
      await this.walletService.findAndUpdateWallet(job.data.walletId, { balance: newBalance });
      //update transaction
      await this.transactionService.updateTransactionById(job.data.transactionId, {
        status: ETransactionStatus.SUCCESS,
      });
    } catch (error) {
      this.logger.error(error);
      await this.transactionService.updateTransactionById(job.data.transactionId, {
        status: ETransactionStatus.FAILED,
      });
    }
  }

  @Process(WalletTypeTransaction.TRANSFER)
  async transferFund(job: Job) {
    this.logger.debug(`Handle Event ${WalletTypeTransaction.TRANSFER}`);
    await this.transactionService.updateTransactionById(job.data.transactionId, {
      status: ETransactionStatus.PROCESSING,
    });
    try {
      //TODO: check user is owner of wallet or not, if not restrict transfer action
      const fromBalance = await this.walletService.getBalance(job.data.walletId);
      const amount = job.data.amount;
      if (amount > fromBalance) throw new BadRequestException('Balance of wallet is inadequate to transfer');

      const toBalance = await this.walletService.getBalance(job.data.toId);

      const newFromBalance = fromBalance - amount;
      const newToBalance = toBalance + amount;

      await this.walletService.findAndUpdateWallet(job.data.walletId, { balance: newFromBalance });
      await this.walletService.findAndUpdateWallet(job.data.toId, { balance: newToBalance });
      await this.transactionService.updateTransactionById(job.data.transactionId, {
        status: ETransactionStatus.SUCCESS,
      });
    } catch (error) {
      this.logger.error(error);
      await this.transactionService.updateTransactionById(job.data.transactionId, {
        status: ETransactionStatus.FAILED,
      });
    }
  }
}
