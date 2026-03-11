module.exports = {
  apps: [
    {
      name: 'vibeo',
      script: 'node',
      args: '.next/standalone/server.js',
      cwd: '/opt/vibeo',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        TZ: 'America/Sao_Paulo',
      },
      env_file: '/opt/vibeo/.env',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      out_file: '/var/log/pm2/vibeo-out.log',
      error_file: '/var/log/pm2/vibeo-error.log',
    },
  ],
}
