import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';

@Injectable()
export class TransactionService {
  constructor(@InjectRepository(Transaction) private readonly transactionRepository: Repository<Transaction>) {}
  async createTransaction(transaction: Transaction) {
    return await this.transactionRepository.save(transaction);
  }

  async findTransactionById(transactionId: string): Promise<Transaction> {
    return await this.transactionRepository.findOne({ where: { id: transactionId } });
  }

  async findAndUpdateTransaction(transactionId: string, update: Record<any, any> = {}): Promise<Transaction> {
    const updated = await this.transactionRepository.update({ id: transactionId }, update);
    return updated.affected === 1 ? this.transactionRepository.findOne({ where: { id: transactionId } }) : null;
  }
}
