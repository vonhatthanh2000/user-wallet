import { IsString, IsUUID } from 'class-validator';
import { ECurrency } from 'src/protobuf/interface-ts/enums';

export class CreateWalletDto {
  constructor(partial: Partial<CreateWalletDto>) {
    Object.assign(this, partial);
  }

  @IsUUID()
  userId: string;

  @IsString()
  currency: ECurrency;
}
