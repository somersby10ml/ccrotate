import chalk from 'chalk';
import { SnapCommand } from './snap.js';

export class NextCommand {
  constructor(ccrotate) {
    this.ccrotate = ccrotate;
  }

  async execute() {
    // First, automatically save the current account (like snap --force)
    try {
      const snapCommand = new SnapCommand(this.ccrotate);
      await snapCommand.execute(true); // force = true, no user interaction
    } catch (error) {
      console.error(`Note: Could not save current account - ${error.message}`);
    }

    const profiles = this.ccrotate.loadProfiles();
    const emails = Object.keys(profiles);
    
    if (emails.length === 0) {
      throw new Error('No saved accounts found. Please add accounts first using `ccrotate snap`.');
    }

    if (emails.length === 1) {
      console.log(chalk.yellow('Only one account available. Nothing to switch to.'));
      return;
    }

    let currentEmail;
    try {
      const currentAccount = this.ccrotate.getCurrentAccount();
      currentEmail = currentAccount.email;
    } catch (error) {
      currentEmail = null;
    }

    let nextIndex = 0;
    if (currentEmail && profiles[currentEmail]) {
      const currentIndex = emails.indexOf(currentEmail);
      nextIndex = (currentIndex + 1) % emails.length;
    }

    const nextEmail = emails[nextIndex];
    
    console.log(chalk.blue(`Switching: ${currentEmail || 'unknown'} -> ${nextEmail}`));
    
    // Use the switch command logic
    const accountData = profiles[nextEmail];
    this.ccrotate.writeClaudeFiles(accountData);

    profiles[nextEmail].lastUsed = new Date().toISOString();
    this.ccrotate.saveProfiles(profiles);

    console.log(chalk.green(`✓ Switched to account: ${nextEmail}`));
    console.log(chalk.blue('\n💡 Next steps:'));
    console.log(chalk.gray('  • Restart claude-code to apply account changes'));
    console.log(chalk.gray('  • To resume previous conversation: Use') + chalk.cyan(' /resume') + chalk.gray(' command'));
  }
}