import { Controller } from '@nestjs/common';
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
    const userWallet = await this.walletService.findWalletByUserId(request.id);
    // console.log('wallet :>> ', wallet);
    const balance = await this.walletService.getBalance(userWallet.id);
    return Balance.fromJSON(balance);
  }

  async depositWallet(request: DepositInput): Promise<DepositResponse> {
    const userWallet = await this.walletService.findWalletByUserId(request.userId);
    // TOOD: deposit by userId or WalletId
    const deposit = await this.walletService.depositWallet(
      userWallet.id,
      request.amount,
      request.currency as ECurrency,
      request.detail,
    );
    //TODO: add status, error,...
    return DepositResponse.fromJSON(0);
  }

  async transferFund(request: TransferInput): Promise<TransferResponse> {
    const transfer = await this.walletService.transferWalletFund(
      request.fromId,
      request.toId,
      request.amount,
      request.currency as ECurrency,
      request.details,
    );

    return TransferResponse.fromJSON(0);
  }
}
