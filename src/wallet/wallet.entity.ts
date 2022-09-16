import BaseTable from 'src/common/typeorm/base-table';
import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Min } from 'class-validator';
import { ECurrency } from 'src/protobuf/interface-ts/enums';
@Entity()
export class Wallet extends BaseTable {
  @Column('varchar', { unique: true })
  walletAddress: string;

  @Min(0)
  @Column('integer', { default: 0 })
  balance: number;

  @Column('varchar')
  currency: ECurrency;
}
