import React from 'react';
import { render } from 'ink';
import RefreshView from '../components/RefreshView.js';

export class RefreshCommand {
  constructor(ccrotate) {
    this.ccrotate = ccrotate;
  }

  async execute() {
    const profiles = this.ccrotate.loadProfiles();
    const emails = Object.keys(profiles);
    
    if (emails.length === 0) {
      throw new Error('No saved accounts found. Please add accounts first using `ccrotate snap`.');
    }

    // Track current active account before starting tests
    let currentActiveEmail;
    try {
      const currentAccount = this.ccrotate.getCurrentAccount();
      currentActiveEmail = currentAccount.email;
    } catch (error) {
      currentActiveEmail = null;
    }

    const originalBackup = this.ccrotate.backupCurrentCredentials();
    const accounts = emails.map(email => ({ email }));
    
    return new Promise((resolve) => {
      const testAccount = async (email) => {
        try {
          const accountData = profiles[email];
          this.ccrotate.writeClaudeFiles(accountData);
          
          const testResult = await this.ccrotate.testAccount(email);
          return testResult;
        } catch (error) {
          return {
            status: 'error',
            response: error.message.substring(0, 150)
          };
        }
      };

      const onComplete = () => {
        // If current active account exists and was potentially updated, restore with updated credentials
        if (currentActiveEmail) {
          const updatedProfiles = this.ccrotate.loadProfiles();
          if (updatedProfiles[currentActiveEmail]) {
            // Restore with updated credentials from the profile
            const updatedAccountData = updatedProfiles[currentActiveEmail];
            this.ccrotate.writeClaudeFiles(updatedAccountData);
          } else {
            // Fallback to original backup if account not found in profiles
            this.ccrotate.restoreCredentials(originalBackup);
          }
        } else {
          // No active account was detected, restore original backup
          this.ccrotate.restoreCredentials(originalBackup);
        }
        resolve();
      };

      const app = React.createElement(RefreshView, {
        accounts,
        onTestAccount: testAccount,
        onComplete
      });

      render(app);
    });
  }
}