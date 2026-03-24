import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum BulkDownloadStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  MISSING_FILE = 'MISSING_FILE',
}

@Entity('BULK_DOWNLOADS')
@Index(['jobId'])
@Index(['token'], { unique: true })
@Index(['expireAt'])
export class BulkDownloadEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'job_id', length: 100 })
  jobId: string;

  @Column({ type: 'varchar', length: 255 })
  token: string;

  @Column({ type: 'text', name: 'file_path' })
  filePath: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', name: 'expire_at' })
  expireAt: Date;

  @Column({ type: 'int', name: 'download_count', default: 0 })
  downloadCount: number;

  @Column({ type: 'varchar', length: 30, default: BulkDownloadStatus.ACTIVE })
  status: BulkDownloadStatus;
}

