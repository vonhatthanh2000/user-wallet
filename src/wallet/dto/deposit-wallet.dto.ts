import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ECurrency } from 'src/protobuf/interface-ts/enums';

export class DepositWalletDto {
  constructor(partial: Partial<DepositWalletDto>) {
    Object.assign(this, partial);
  }

  @IsUUID()
  userId: string;

  @IsString()
  currency: ECurrency;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  details: string;
}
