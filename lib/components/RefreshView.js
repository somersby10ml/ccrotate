import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

const RefreshView = ({ accounts, onTestAccount, onComplete }) => {
  const [accountStates, setAccountStates] = useState(() => 
    accounts.map(account => ({
      email: account.email,
      status: 'pending',
      result: '...',
      credentialsUpdated: false
    }))
  );

  useEffect(() => {
    const runTests = async () => {
      // Process accounts sequentially (synchronously)
      for (const account of accounts) {
        // Update status to testing
        setAccountStates(prev => prev.map(state => 
          state.email === account.email 
            ? { ...state, status: 'testing' }
            : state
        ));

        try {
          const result = await onTestAccount(account.email);
          
          // Update with final result
          setAccountStates(prev => prev.map(state => 
            state.email === account.email 
              ? { 
                  ...state, 
                  status: result.status,
                  result: result.response.substring(0, 150),
                  credentialsUpdated: result.credentialsUpdated || false
                }
              : state
          ));
        } catch (error) {
          setAccountStates(prev => prev.map(state => 
            state.email === account.email 
              ? { 
                  ...state, 
                  status: 'error',
                  result: error.message.substring(0, 150),
                  credentialsUpdated: false
                }
              : state
          ));
        }
      }

      onComplete();
    };

    runTests();
  }, [accounts, onTestAccount, onComplete]);

  const getStatusDisplay = (status, credentialsUpdated) => {
    let baseDisplay;
    switch (status) {
      case 'pending':
        baseDisplay = { text: '⏳ Pending', color: 'gray' };
        break;
      case 'testing':
        baseDisplay = { text: '🔄 Testing', color: 'yellow' };
        break;
      case 'success':
        baseDisplay = { text: '✅ Active', color: 'green' };
        break;
      case 'error':
        baseDisplay = { text: '❌ Failed', color: 'red' };
        break;
      default:
        baseDisplay = { text: '❓ Unknown', color: 'gray' };
    }

    if (credentialsUpdated && (status === 'success' || status === 'error')) {
      baseDisplay.text += ' 🔄';
    }

    return baseDisplay;
  };

  return React.createElement(Box, { flexDirection: 'column', marginTop: 1 },
    React.createElement(Text, { bold: true, color: 'blue' }, '🔄 Testing accounts and refreshing tokens...'),
    React.createElement(Text, null, ' '),
    
    // Header
    React.createElement(Box, null,
      React.createElement(Box, { width: '3%' },
        React.createElement(Text, { bold: true, color: 'gray' }, '#')
      ),
      React.createElement(Box, { width: '3%' },
        React.createElement(Text, { bold: true, color: 'gray' }, ' ')
      ),
      React.createElement(Box, { width: '30%' },
        React.createElement(Text, { bold: true, color: 'gray' }, 'Email')
      ),
      React.createElement(Box, { width: '15%' },
        React.createElement(Text, { bold: true, color: 'gray' }, 'Status')
      ),
      React.createElement(Box, { width: '49%' },
        React.createElement(Text, { bold: true, color: 'gray' }, 'Result')
      )
    ),
    
    // Separator
    React.createElement(Box, null,
      React.createElement(Text, { color: 'gray' }, '─'.repeat(80))
    ),
    
    // Account rows
    ...accountStates.map((accountState, index) => {
      const statusDisplay = getStatusDisplay(accountState.status, accountState.credentialsUpdated);
      
      return React.createElement(Box, { key: accountState.email },
        React.createElement(Box, { width: '3%' },
          React.createElement(Text, { color: 'gray' }, index + 1)
        ),
        React.createElement(Box, { width: '3%' },
          React.createElement(Text, { color: 'gray' }, ' ')
        ),
        React.createElement(Box, { width: '30%' },
          React.createElement(Text, { color: 'white' }, accountState.email)
        ),
        React.createElement(Box, { width: '15%' },
          React.createElement(Text, { color: statusDisplay.color }, statusDisplay.text)
        ),
        React.createElement(Box, { width: '49%' },
          React.createElement(Text, { color: 'gray' }, 
            accountState.result + (accountState.credentialsUpdated ? ' (Updated)' : '')
          )
        )
      );
    }),
    
    React.createElement(Text, null, ' ')
  );
};

export default RefreshView;