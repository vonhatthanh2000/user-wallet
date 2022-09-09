import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ECurrency } from 'src/protobuf/interface-ts/enums';
import { Repository } from 'typeorm';
import { Wallet } from './wallet.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
  ) {}

  async createWallet(userId: string, currency: ECurrency): Promise<Wallet> {
    const wallet = await this.walletRepository.save({
      id: uuidv4(),
      userId: userId,
      balance: 0,
      currency: currency,
    });
    return wallet;
  }

  async depositWallet(walletId: string, amount: number): Promise<Wallet> {
    const currentBalance = await this.getBalance(walletId);
    const endBalance = currentBalance + amount;

    return await this.findAndUpdateWallet(walletId, { balance: endBalance });
  }

  async transferWalletFund(walletId: string, destinateId: string, amount: number) {
    const originWallet = await this.findWallet(walletId);
    if (!originWallet) throw new NotFoundException('wallet does not exist');
    const destinateWallet = await this.findWallet(destinateId);
    if (!destinateWallet) throw new NotFoundException('wallet does not exist');

    const originBalance = await this.getBalance(walletId);
    if (amount > originBalance) throw new BadRequestException('balance of wallet is inadequate to transfer');

    const destinateBalance = await this.getBalance(destinateId);

    const endOriginBalance = originBalance - amount;
    const endDesBalance = destinateBalance + amount;

    await this.findAndUpdateWallet(walletId, { balance: endOriginBalance });
    await this.findAndUpdateWallet(destinateId, { balance: endDesBalance });
  }

  async getBalance(walletId: string): Promise<number> {
    const wallet = await this.findWallet(walletId);
    return wallet.balance;
  }

  async findWallet(walletId: string): Promise<Wallet> {
    return await this.walletRepository.findOne({ where: { id: walletId } });
  }
  async findAndUpdateWallet(walletId: string, update: Record<any, any> = {}): Promise<Wallet> {
    const updated = await this.walletRepository.update({ id: walletId }, update);
    return updated.affected === 1 ? this.walletRepository.findOne({ where: { id: walletId } }) : null;
  }
}
