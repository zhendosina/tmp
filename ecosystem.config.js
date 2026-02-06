module.exports = {
  apps: [{
    name: 'blood-parser',
    script: 'npm',
    args: 'start',
    cwd: '/root/blood-report-parser',
    env: {
      NODE_ENV: 'production',
      OCR_PASSPHRASE: '1123581321',
      ZAI_API_KEY: '5511e1f1de094c63b0485421438bf67c.VYkKM8K7SZw2C6u9'
    },
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};