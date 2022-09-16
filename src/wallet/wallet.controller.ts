import { BadGatewayException, BadRequestException, Controller, NotFoundException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ECurrency } from 'src/protobuf/interface-ts/enums';
import {
  WalletInput,
  BalanceInput,
  Wallet as WalletProto,
  DepositInput,
  DepositResponse,
  TransferInput,
  TransferResponse,
  WalletServiceControllerMethods,
  WalletServiceController as WalletServiceControllerGrpc,
  Balance,
} from 'src/protobuf/interface-ts/wallet';

import { WalletService } from './wallet.service';

@Controller()
@WalletServiceControllerMethods()
export class WalletController implements WalletServiceControllerGrpc {
  constructor(private readonly walletService: WalletService) {}

  async createWallet(request: WalletInput): Promise<WalletProto> {
    const wallet = await this.walletService.createWallet(request.userId, request.currency as ECurrency);
    return WalletProto.fromJSON(wallet);
  }

  async getBalance(request: BalanceInput): Promise<Balance> {
    const wallet = await this.walletService.findWallet(request.walletAddress);

    //check if user is owner of this walletAddress or not
    const currency = wallet.currency;
    const walletAddress = await this.walletService.getWalletAddress(request.userId, currency);
    if (walletAddress != request.walletAddress) throw new RpcException('User is not the owner of this wallet');

    const balance = await this.walletService.getBalance(walletAddress);
    const res = { balance };
    return Balance.fromJSON(res);
  }

  async depositWallet(request: DepositInput): Promise<DepositResponse> {
    //check whether user is owner of this walletAddress or not
    const userWalletAddress = await this.walletService.getWalletAddress(request.userId, request.currency as ECurrency);
    if (userWalletAddress != request.walletAddress) throw new RpcException('User is not the owner of this wallet');
    const userWallet = await this.walletService.findWallet(request.userId);
    const deposit = await this.walletService.depositWallet(
      request.walletAddress,
      request.amount,
      request.currency as ECurrency,
      request.details,
    );

    return DepositResponse.fromJSON(0);
  }

  async transferFund(request: TransferInput): Promise<TransferResponse> {
    //check if wallet is exist or not
    const fromWallet = await this.walletService.findWallet(request.fromAddress);
    if (!fromWallet) throw new NotFoundException('Wallet does not exist');

    //check whether user is owner of this walletAddress or not
    const userWalletAddress = await this.walletService.getWalletAddress(request.userId, request.currency as ECurrency);
    if (userWalletAddress != request.fromAddress) throw new RpcException('User is not the owner of this wallet');

    const toWallet = await this.walletService.findWallet(request.toAddress);
    if (!toWallet) throw new NotFoundException('wallet does not exist');
    const transfer = await this.walletService.transferWalletFund(
      request.fromAddress,
      request.toAddress,
      request.amount,
      request.currency as ECurrency,
      request.details,
    );

    return TransferResponse.fromJSON(0);
  }
}
