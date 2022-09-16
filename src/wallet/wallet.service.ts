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
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

const { SECRET_CIPHER } = process.env;
@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet) private readonly walletRepository: Repository<Wallet>,
    @InjectQueue('wallet') private walletQueue: Queue,
    private readonly transactionService: TransactionService,
  ) {}

  async createWallet(userId: string, currency: ECurrency): Promise<Wallet> {
    // create wallet address
    const walletAddress = await this.getWalletAddress(userId, currency);

    const wallet = await this.walletRepository.save({
      id: uuidv4(),
      walletAddress: walletAddress,
      balance: 0,
      currency: currency,
    });
    return wallet;
  }

  async depositWallet(walletAddress: string, amount: number, currency: ECurrency, details: string = null) {
    const newTransaction = {
      id: uuidv4(),
      origin: null,
      destination: walletAddress,
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
      { transactionId: newTransaction.id, walletAddress, amount, currency, details },
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

  async transferWalletFund(
    fromAddress: string,
    toAddress: string,
    amount: number,
    currency: ECurrency,
    details: string,
  ) {
    const newTransaction = {
      id: uuidv4(),
      origin: fromAddress,
      destination: toAddress,
      currency: currency,
      amount: amount,
      details: details,
      type: WalletTypeTransaction.TRANSFER,
      status: ETransactionStatus.INQUEUE,
    };

    await this.transactionService.createTransaction(newTransaction as Transaction);

    await this.walletQueue.add(
      WalletTypeTransaction.TRANSFER,
      { transactionId: newTransaction.id, fromAddress, toAddress, amount, currency, details },
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

  async getBalance(walletAddress: string): Promise<number> {
    const wallet = await this.findWallet(walletAddress);
    if (!wallet) throw new NotFoundException('wallet does not exist');
    return wallet.balance;
  }

  async findWallet(walletAddress: string): Promise<Wallet> {
    return await this.walletRepository.findOne({ where: { walletAddress } });
  }

  // async findWalletByUserId(userId: string): Promise<Wallet> {
  //   return await this.walletRepository.findOne({ where: { userId: userId } });
  // }

  async findAndUpdateWallet(walletAddress: string, update: Record<any, any> = {}): Promise<Wallet> {
    const updated = await this.walletRepository.update({ walletAddress }, update);
    return updated.affected === 1 ? this.walletRepository.findOne({ where: { walletAddress } }) : null;
  }

  async getWalletAddress(userId: string, currency: ECurrency): Promise<string> {
    const inputStr = userId + <string>currency + SECRET_CIPHER;
    const hashPwd = crypto.createHash('sha256').update(inputStr).digest('hex');
    return hashPwd;
  }
}
