import { Body, Controller, Get, Post } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ECurrency } from 'src/protobuf/interface-ts/enums';
import {
  WalletInput,
  User as UserProto,
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

  async getBalance(request: UserProto): Promise<Balance> {
    const wallet = await this.walletService.findWalletByUserId(request.id);
    // console.log('wallet :>> ', wallet);
    const balance = await this.walletService.getBalance(wallet.id);
    return Balance.fromJSON(balance);
  }

  async depositWallet(request: DepositInput): Promise<DepositResponse> {
    console.log('2 :>> ', 2);
    return DepositResponse.fromJSON(0);
  }

  async transferFund(request: TransferInput): Promise<TransferResponse> {
    console.log('3 :>> ', 3);
    return TransferResponse.fromJSON(0);
  }
}
