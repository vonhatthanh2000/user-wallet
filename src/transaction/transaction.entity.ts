import BaseTable from 'src/common/typeorm/base-table';
import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Min } from 'class-validator';
import { ECurrency, ETransactionStatus, WalletTypeTransaction } from 'src/protobuf/interface-ts/enums';

@Entity()
export class Transaction extends BaseTable {
  @Column('varchar', { nullable: true })
  origin!: string;

  @Column('varchar')
  destination!: string;

  @Column('varchar')
  currency: ECurrency;

  @Min(1)
  @Column('integer')
  amount: number;

  @Column('varchar', { nullable: true })
  details: string;

  @Column('varchar')
  type: WalletTypeTransaction;

  @Column('varchar')
  status: ETransactionStatus;
}
