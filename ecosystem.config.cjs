module.exports = {
  apps: [{
    name: 'egemp-portal',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/egemp-portal',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    }
  }]
};