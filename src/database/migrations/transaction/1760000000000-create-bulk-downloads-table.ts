import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBulkDownloadsTable1760000000000 implements MigrationInterface {
  name = 'CreateBulkDownloadsTable1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "BULK_DOWNLOADS" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "job_id" varchar(100) NOT NULL,
        "token" varchar(255) NOT NULL,
        "file_path" text NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "expire_at" timestamp NOT NULL,
        "download_count" integer NOT NULL DEFAULT 0,
        "status" varchar(30) NOT NULL DEFAULT 'ACTIVE'
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_BULK_DOWNLOADS_TOKEN"
      ON "BULK_DOWNLOADS" ("token")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_BULK_DOWNLOADS_JOB_ID"
      ON "BULK_DOWNLOADS" ("job_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_BULK_DOWNLOADS_EXPIRE_AT"
      ON "BULK_DOWNLOADS" ("expire_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_BULK_DOWNLOADS_EXPIRE_AT"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_BULK_DOWNLOADS_JOB_ID"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_BULK_DOWNLOADS_TOKEN"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "BULK_DOWNLOADS"`);
  }
}

