import BaseTable from 'src/common/typeorm/base-table';
import { Column, Entity } from 'typeorm';
import { Min } from 'class-validator';
import { ECurrency, ETransactionStatus } from 'src/protobuf/interface-ts/enums';

@Entity()
export class Transaction extends BaseTable {
  @Column('uuid')
  origin!: string;

  @Column('uuid')
  destination!: string;

  @Column('varchar')
  currency: ECurrency;

  @Min(1)
  @Column('integer')
  amount: number;

  @Column('varchar')
  details: string;

  @Column('varchar')
  status: ETransactionStatus;
}
