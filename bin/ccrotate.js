#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import CCRotate from '../lib/ccrotate.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));
const { version } = packageJson;

const program = new Command();
const ccrotate = new CCRotate();

program
  .name('ccrotate')
  .description('A simple CLI tool to manage and rotate multiple Claude Code accounts, helping you bypass rate limits')
  .version(version, '-v, --version', 'output the version number');

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

program
  .command('refresh')
  .alias('rf')
  .description('Test all accounts and refresh tokens')
  .action(async () => {
    try {
      await ccrotate.refresh();
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('export')
  .description('Export all profiles as compressed string')
  .action(async () => {
    try {
      await ccrotate.export();
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('import <data>')
  .description('Import profiles from compressed string')
  .action(async (data) => {
    try {
      await ccrotate.import(data);
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();

if (!process.argv.slice(2).length) {
  program.outputHelp();
}