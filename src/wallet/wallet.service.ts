import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ECurrency, ETransactionStatus, WalletTypeTransaction } from 'src/protobuf/interface-ts/enums';
import { Repository } from 'typeorm';
import { Wallet } from './wallet.entity';
import { TransactionService } from 'src/transaction/transaction.service';
import { Transaction } from 'src/transaction/transaction.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet) private readonly walletRepository: Repository<Wallet>,
    @InjectQueue('wallet') private walletQueue: Queue,
    private readonly transactionService: TransactionService,
  ) {}

  async createWallet(userId: string, currency: ECurrency): Promise<Wallet> {
    const userWallet = await this.findWalletByUserId(userId);
    if (userWallet) throw new BadRequestException('User already has wallet');

    const wallet = await this.walletRepository.save({
      id: uuidv4(),
      userId: userId,
      balance: 0,
      currency: currency,
    });
    return wallet;
  }

  async depositWallet(walletId: string, amount: number, currency: ECurrency, details: string = null) {
    const newTransaction = {
      id: uuidv4(),
      origin: null,
      destination: walletId,
      currency: currency,
      amount: amount,
      details: details,
      type: WalletTypeTransaction.DEPOSIT,
      status: ETransactionStatus.INQUEUE,
    };
    await this.transactionService.createTransaction(newTransaction as Transaction);
    // Add to queue
    this.walletQueue.add(
      WalletTypeTransaction.DEPOSIT,
      { transactionId: newTransaction.id, walletId, amount, currency, details },
      {
        removeOnComplete: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );
  }

  async transferWalletFund(walletId: string, toId: string, amount: number, currency: ECurrency, details: string) {
    const fromWallet = await this.findWallet(walletId);
    if (!fromWallet) throw new NotFoundException('wallet does not exist');
    const toWallet = await this.findWallet(toId);
    if (!toWallet) throw new NotFoundException('wallet does not exist');

    const newTransaction = {
      id: uuidv4(),
      origin: fromWallet.id,
      destination: toWallet.id,
      currency: currency,
      amount: amount,
      details: details,
      type: WalletTypeTransaction.TRANSFER,
      status: ETransactionStatus.INQUEUE,
    };
    await this.transactionService.createTransaction(newTransaction as Transaction);

    this.walletQueue.add(
      WalletTypeTransaction.TRANSFER,
      { transactionId: newTransaction.id, walletId, toId, amount, currency, details },
      {
        removeOnComplete: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );
  }

  async getBalance(walletId: string): Promise<number> {
    const wallet = await this.findWallet(walletId);
    if (!wallet) throw new NotFoundException('wallet does not exist');
    return wallet.balance;
  }

  async findWallet(walletId: string): Promise<Wallet> {
    return await this.walletRepository.findOne({ where: { id: walletId } });
  }

  async findWalletByUserId(userId: string): Promise<Wallet> {
    return await this.walletRepository.findOne({ where: { userId: userId } });
  }

  async findAndUpdateWallet(walletId: string, update: Record<any, any> = {}): Promise<Wallet> {
    const updated = await this.walletRepository.update({ id: walletId }, update);
    return updated.affected === 1 ? this.walletRepository.findOne({ where: { id: walletId } }) : null;
  }
}
