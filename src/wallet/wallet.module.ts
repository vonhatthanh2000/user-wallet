import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionModule } from 'src/transaction/transaction.module';
import { WalletController } from './wallet.controller';
import { Wallet } from './wallet.entity';
import { PaymentProcessor } from './wallet.processor';
import { WalletService } from './wallet.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet]),
    BullModule.registerQueue({
      name: 'wallet',
    }),
    TransactionModule,
  ],
  controllers: [WalletController],
  providers: [WalletService, PaymentProcessor],
  exports: [WalletService, PaymentProcessor],
})
export class WalletModule {}
