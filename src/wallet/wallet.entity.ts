import BaseTable from 'src/common/typeorm/base-table';
import { Column, Entity, Index } from 'typeorm';

@Entity()
export class Wallet extends BaseTable {
  @Column('uuid')
  user: string;

  @Column('integer', { default: 0 })
  balance;
}
