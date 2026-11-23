module.exports = {
  apps: [
    {
      name: 'medi-waste-management-backend',
      script: './dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Schema synchronization must never run in production (it alters/drops tables). The application also
        // ignores these flags unless NODE_ENV is exactly "development", but they are pinned here explicitly.
        MASTER_DB_SYNCHRONIZE: 'false',
        TRANSACTION_DB_SYNCHRONIZE: 'false',
        REPORT_DB_SYNCHRONIZE: 'false',
        DB_SYNCHRONIZE: 'false',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      instance_var: 'INSTANCE_ID',
    },
  ],
};
