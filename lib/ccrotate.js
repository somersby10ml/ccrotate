const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');
const prompts = require('prompts');

class CCRotate {
  constructor() {
    this.profilesDir = path.join(os.homedir(), '.ccrotate');
    this.profilesFile = path.join(this.profilesDir, 'profiles.json');
    this.claudeDir = path.join(os.homedir(), '.claude');
    this.credentialsFile = path.join(this.claudeDir, '.credentials.json');
    this.claudeConfigFile = path.join(os.homedir(), '.claude.json');
  }

  ensureProfilesDir() {
    if (!fs.existsSync(this.profilesDir)) {
      fs.mkdirSync(this.profilesDir, { recursive: true });
    }
  }

  loadProfiles() {
    if (!fs.existsSync(this.profilesFile)) {
      return {};
    }
    
    try {
      const data = fs.readFileSync(this.profilesFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to parse profiles.json: ${error.message}`);
    }
  }

  saveProfiles(profiles) {
    this.ensureProfilesDir();
    
    try {
      const tempFile = this.profilesFile + '.tmp';
      fs.writeFileSync(tempFile, JSON.stringify(profiles, null, 2), 'utf8');
      fs.renameSync(tempFile, this.profilesFile);
    } catch (error) {
      throw new Error(`Failed to save profiles: ${error.message}`);
    }
  }

  getCurrentAccount() {
    if (!fs.existsSync(this.credentialsFile)) {
      throw new Error('No active Claude account found. Please login with claude-code first.');
    }

    if (!fs.existsSync(this.claudeConfigFile)) {
      throw new Error('Claude config file not found. Please login with claude-code first.');
    }

    try {
      const credentials = JSON.parse(fs.readFileSync(this.credentialsFile, 'utf8'));
      const config = JSON.parse(fs.readFileSync(this.claudeConfigFile, 'utf8'));
      
      if (!config.oauthAccount || !config.oauthAccount.emailAddress) {
        throw new Error('No OAuth account information found in Claude config.');
      }

      return {
        email: config.oauthAccount.emailAddress,
        credentials,
        userId: config.userId,
        oauthAccount: config.oauthAccount
      };
    } catch (error) {
      throw new Error(`Failed to read current account: ${error.message}`);
    }
  }

  writeClaudeFiles(accountData) {
    try {
      const credentialsTemp = this.credentialsFile + '.tmp';
      const configTemp = this.claudeConfigFile + '.tmp';

      fs.writeFileSync(credentialsTemp, JSON.stringify(accountData.credentials, null, 2), 'utf8');
      
      const currentConfig = fs.existsSync(this.claudeConfigFile) 
        ? JSON.parse(fs.readFileSync(this.claudeConfigFile, 'utf8'))
        : {};
      
      const newConfig = {
        ...currentConfig,
        userId: accountData.userId,
        oauthAccount: accountData.oauthAccount
      };
      
      fs.writeFileSync(configTemp, JSON.stringify(newConfig, null, 2), 'utf8');

      fs.renameSync(credentialsTemp, this.credentialsFile);
      fs.renameSync(configTemp, this.claudeConfigFile);
    } catch (error) {
      throw new Error(`Failed to write account files: ${error.message}`);
    }
  }

  async snap(force = false) {
    const currentAccount = this.getCurrentAccount();
    const profiles = this.loadProfiles();
    
    if (profiles[currentAccount.email] && !force) {
      const response = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: `Account ${currentAccount.email} already exists. Overwrite?`,
        initial: false
      });
      
      if (!response.overwrite) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }
    }

    profiles[currentAccount.email] = {
      credentials: currentAccount.credentials,
      userId: currentAccount.userId,
      oauthAccount: currentAccount.oauthAccount,
      lastUsed: new Date().toISOString()
    };

    this.saveProfiles(profiles);
    console.log(chalk.green(`✓ Account ${currentAccount.email} saved successfully.`));
  }

  async list() {
    const profiles = this.loadProfiles();
    const emails = Object.keys(profiles);
    
    if (emails.length === 0) {
      console.log(chalk.yellow('No saved accounts found.'));
      console.log(chalk.blue('Please login with claude-code and run `ccrotate snap` to add your first account.'));
      return;
    }

    let currentEmail;
    try {
      const currentAccount = this.getCurrentAccount();
      currentEmail = currentAccount.email;
    } catch (error) {
      currentEmail = null;
    }

    console.log(chalk.bold('\nSaved Accounts:'));
    emails.forEach((email, index) => {
      const profile = profiles[email];
      const lastUsed = new Date(profile.lastUsed).toLocaleDateString();
      const isCurrent = email === currentEmail;
      const marker = isCurrent ? chalk.green('★') : ' ';
      
      console.log(`${marker} ${index + 1}. ${email} (last used: ${lastUsed})`);
    });
    console.log();
  }

  async switch(email) {
    const profiles = this.loadProfiles();
    
    if (!profiles[email]) {
      throw new Error(`Account ${email} not found. Run 'ccrotate list' to see available accounts.`);
    }

    const accountData = profiles[email];
    this.writeClaudeFiles(accountData);

    profiles[email].lastUsed = new Date().toISOString();
    this.saveProfiles(profiles);

    console.log(chalk.green(`✓ Switched to account: ${email}`));
  }

  async next() {
    const profiles = this.loadProfiles();
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
      const currentAccount = this.getCurrentAccount();
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
    await this.switch(nextEmail);
  }

  async remove(email) {
    const profiles = this.loadProfiles();
    
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
    this.saveProfiles(profiles);
    
    console.log(chalk.green(`✓ Account ${email} removed successfully.`));
  }
}

module.exports = CCRotate;