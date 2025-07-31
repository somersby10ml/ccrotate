import chalk from 'chalk';
import prompts from 'prompts';

export class RemoveCommand {
  constructor(ccrotate) {
    this.ccrotate = ccrotate;
  }

  async execute(email) {
    const profiles = this.ccrotate.loadProfiles();
    
    if (!profiles[email]) {
      throw new Error(`Account ${email} not found.`);
    }

    const response = await prompts({
      type: 'confirm',
      name: 'remove',
      message: `Are you sure you want to remove account ${email}?`,
      initial: false
    });
    
    if (!response.remove) {
      console.log(chalk.yellow('Operation cancelled.'));
      return;
    }

    delete profiles[email];
    this.ccrotate.saveProfiles(profiles);
    
    console.log(chalk.green(`✓ Account ${email} removed successfully.`));
  }
}