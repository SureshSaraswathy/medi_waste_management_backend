import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateNotificationsTables1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create notifications table
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'message',
            type: 'text',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['INFO', 'WARNING', 'ERROR', 'APPROVAL', 'ALERT'],
            default: "'INFO'",
          },
          {
            name: 'module',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'reference_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create notification_receivers table
    await queryRunner.createTable(
      new Table({
        name: 'notification_receivers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'notification_id',
            type: 'uuid',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'role_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'is_read',
            type: 'boolean',
            default: false,
          },
          {
            name: 'read_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'priority',
            type: 'enum',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            default: "'MEDIUM'",
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_module_created_at',
        columnNames: ['module', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_created_at',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'notification_receivers',
      new TableIndex({
        name: 'IDX_notification_receivers_user_id_is_read',
        columnNames: ['user_id', 'is_read'],
      }),
    );

    await queryRunner.createIndex(
      'notification_receivers',
      new TableIndex({
        name: 'IDX_notification_receivers_role_id_is_read',
        columnNames: ['role_id', 'is_read'],
      }),
    );

    await queryRunner.createIndex(
      'notification_receivers',
      new TableIndex({
        name: 'IDX_notification_receivers_notification_id',
        columnNames: ['notification_id'],
      }),
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      'notification_receivers',
      new TableForeignKey({
        columnNames: ['notification_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'notifications',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('notification_receivers', true);
    await queryRunner.dropTable('notifications', true);
  }
}
