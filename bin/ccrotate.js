#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const CCRotate = require('../lib/ccrotate');
const { version } = require('../package.json');

const program = new Command();
const ccrotate = new CCRotate();

program
  .name('ccrotate')
  .description('A simple CLI tool to manage and rotate multiple Claude Code accounts, helping you bypass rate limits')
  .version(version, '-v, -V, --version', 'output the version number');

program
  .command('snap')
  .description('Save current account information')
  .option('--force', 'Skip confirmation prompt when overwriting existing account')
  .action(async (options) => {
    try {
      await ccrotate.snap(options.force);
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('list')
  .alias('ls')
  .description('Show saved accounts')
  .action(async () => {
    try {
      await ccrotate.list();
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('switch <email>')
  .description('Switch to specific account')
  .action(async (email) => {
    try {
      await ccrotate.switch(email);
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('next')
  .description('Switch to next account in rotation')
  .action(async () => {
    try {
      await ccrotate.next();
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('remove <email>')
  .alias('rm')
  .description('Remove saved account')
  .action(async (email) => {
    try {
      await ccrotate.remove(email);
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();

if (!process.argv.slice(2).length) {
  program.outputHelp();
}