import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ECurrency, ETransactionStatus, WalletTypeTransaction } from 'src/protobuf/interface-ts/enums';
import { Repository } from 'typeorm';
import { Wallet } from './wallet.entity';
import { TransactionService } from 'src/transaction/transaction.service';
import { Transaction } from 'src/transaction/transaction.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet) private readonly walletRepository: Repository<Wallet>,
    private readonly transactionService: TransactionService, //
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

  async depositWallet(walletId: string, amount: number, currency: ECurrency, details: string = null): Promise<Wallet> {
    const newTransaction = {
      id: uuidv4(),
      origin: null,
      destination: walletId,
      currency: currency,
      amount: amount,
      details: details,
      type: WalletTypeTransaction.DEPOSIT,
      status: ETransactionStatus.PROCESSING,
    };

    await this.transactionService.createTransaction(newTransaction as Transaction);
    const currentBalance = await this.getBalance(walletId);
    const newBalance = currentBalance + amount;

    return await this.findAndUpdateWallet(walletId, { balance: newBalance });
  }

  async transferWalletFund(walletId: string, toId: string, amount: number, currency: ECurrency, details: string) {
    const fromWallet = await this.findWallet(walletId);
    if (!fromWallet) throw new NotFoundException('wallet does not exist');
    const toWallet = await this.findWallet(toId);
    if (!toWallet) throw new NotFoundException('wallet does not exist');

    const fromBalance = await this.getBalance(walletId);
    if (amount > fromBalance) throw new BadRequestException('balance of wallet is inadequate to transfer');

    const toBalance = await this.getBalance(toId);

    const newFromBalance = fromBalance - amount;
    const newToBalance = toBalance + amount;

    const newTransaction = {
      id: uuidv4(),
      origin: fromWallet.id,
      destination: toWallet.id,
      currency: currency,
      amount: amount,
      details: details,
      type: WalletTypeTransaction.TRANSFER,
      status: ETransactionStatus.PROCESSING,
    };

    await this.transactionService.createTransaction(newTransaction as Transaction);

    await this.findAndUpdateWallet(walletId, { balance: newFromBalance });
    await this.findAndUpdateWallet(toId, { balance: newToBalance });
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
