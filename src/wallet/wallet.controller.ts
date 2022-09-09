import { Body, Controller, Get, Post } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { DepositWalletDto } from './dto/deposit-wallet.dto';
import { Wallet } from './wallet.entity';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @GrpcMethod('WalletService', 'FindOne')
  findOne(id: string): Wallet {
    // const items = [
    //   { id: 1, name: 'John' },
    //   { id: 2, name: 'Doe' },
    // ];
    // return items.find(({ id }) => id === data.id);
    return;
  }

  @Post('create-wallet')
  async createWallet(@Body() dto: CreateWalletDto) {
    const newWallet = await this.walletService.createWallet(dto.userId, dto.currency);
    return newWallet;
  }

  @Get('balance')
  async getBalance(@Body() dto: CreateWalletDto) {
    const wallet = await this.walletService.findWallet(dto.userId);
  }

  @Post('deposit')
  async deposit(@Body() dto: DepositWalletDto) {
    const deposit = await this.walletService.depositWallet(dto.userId, dto.amount);
  }
}
