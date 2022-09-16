import { OnQueueActive, OnQueueCompleted, OnQueueStalled, Process, Processor } from '@nestjs/bull';
import { BadRequestException, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
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
      const currentBalance = await this.walletService.getBalance(job.data.walletAddress);
      if (job.data.amount < 0) throw new BadRequestException('amount should be larger than 0');
      const newBalance = currentBalance + job.data.amount;
      await this.walletService.findAndUpdateWallet(job.data.walletAddress, { balance: newBalance });
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
      //check currency of 2 wallet, 2 wallet should be exactly the same currency
      const fromWallet = await this.walletService.findWallet(job.data.fromAddress);
      if (!fromWallet) throw new NotFoundException('Wallet does not exist');
      const toWallet = await this.walletService.findWallet(job.data.toAddress);
      if (!toWallet) throw new NotFoundException('Wallet does not exist');

      if (fromWallet.currency != job.data.currency || toWallet.currency != job.data.currency)
        throw new BadRequestException('Two wallets do not have the same currency');

      //check balance of wallet is enough to transfer or not
      const fromBalance = await this.walletService.getBalance(job.data.fromAddress);
      const amount = job.data.amount;
      // if (amount > fromBalance) throw new BadRequestException('Balance of wallet is inadequate to transfer');
      if (amount > fromBalance) throw new RpcException('Balance of wallet is inadequate to transfer');

      const toBalance = toWallet.balance;

      const newFromBalance = fromBalance - amount;
      const newToBalance = toBalance + amount;

      await this.walletService.findAndUpdateWallet(job.data.fromAddress, { balance: newFromBalance });
      await this.walletService.findAndUpdateWallet(job.data.toAddress, { balance: newToBalance });
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
