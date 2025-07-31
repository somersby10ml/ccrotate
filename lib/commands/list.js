import React from 'react';
import { render } from 'ink';
import AccountsList from '../components/AccountsList.js';
import { formatExpiresAt } from '../utils/formatExpiresAt/index.js';

export class ListCommand {
  constructor(ccrotate) {
    this.ccrotate = ccrotate;
  }

  async execute() {
    const profiles = this.ccrotate.loadProfiles();
    const emails = Object.keys(profiles);
    
    let currentEmail;
    try {
      const currentAccount = this.ccrotate.getCurrentAccount();
      currentEmail = currentAccount.email;
    } catch (error) {
      currentEmail = null;
    }

    const accounts = emails.map(email => {
      const profile = profiles[email];
      const lastUsed = new Date(profile.lastUsed).toLocaleDateString();
      
      let expiresAt = 'Unknown';
      try {
        if (profile.credentials && profile.credentials.claudeAiOauth && profile.credentials.claudeAiOauth.expiresAt) {
          expiresAt = formatExpiresAt(profile.credentials.claudeAiOauth.expiresAt);
        }
      } catch (error) {
        expiresAt = 'Invalid';
      }
      
      return {
        email,
        lastUsed,
        expiresAt
      };
    });

    const app = React.createElement(AccountsList, {
      accounts,
      currentEmail
    });

    render(app);
  }
}