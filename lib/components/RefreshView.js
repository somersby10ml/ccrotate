import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

const RefreshView = ({ accounts, onTestAccount, onComplete }) => {
  const [accountStates, setAccountStates] = useState(() => 
    accounts.map(account => ({
      email: account.email,
      status: 'pending',
      result: '...'
    }))
  );

  useEffect(() => {
    const runTests = async () => {
      const promises = accounts.map(async (account, index) => {
        const delay = index * 1000; // 1 second delay between starts
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
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
                  result: result.response
                }
              : state
          ));
        } catch (error) {
          setAccountStates(prev => prev.map(state => 
            state.email === account.email 
              ? { 
                  ...state, 
                  status: 'error',
                  result: error.message.substring(0, 50) + '...'
                }
              : state
          ));
        }
      });

      await Promise.all(promises);
      onComplete();
    };

    runTests();
  }, [accounts, onTestAccount, onComplete]);

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending':
        return { text: '⏳ Pending', color: 'gray' };
      case 'testing':
        return { text: '🔄 Testing...', color: 'yellow' };
      case 'success':
        return { text: '✅ Active', color: 'green' };
      case 'error':
        return { text: '❌ Failed', color: 'red' };
      default:
        return { text: '❓ Unknown', color: 'gray' };
    }
  };

  return React.createElement(Box, { flexDirection: 'column', marginTop: 1 },
    React.createElement(Text, { bold: true, color: 'blue' }, '🔄 Testing accounts and refreshing tokens...'),
    React.createElement(Text, null, ' '),
    
    // Header
    React.createElement(Box, null,
      React.createElement(Box, { width: '3%' },
        React.createElement(Text, { bold: true, color: 'gray' }, '#')
      ),
      React.createElement(Box, { width: '35%' },
        React.createElement(Text, { bold: true, color: 'gray' }, 'Email')
      ),
      React.createElement(Box, { width: '20%' },
        React.createElement(Text, { bold: true, color: 'gray' }, 'Status')
      ),
      React.createElement(Box, { width: '42%' },
        React.createElement(Text, { bold: true, color: 'gray' }, 'Result')
      )
    ),
    
    // Separator
    React.createElement(Box, null,
      React.createElement(Text, { color: 'gray' }, '─'.repeat(80))
    ),
    
    // Account rows
    ...accountStates.map((accountState, index) => {
      const statusDisplay = getStatusDisplay(accountState.status);
      
      return React.createElement(Box, { key: accountState.email },
        React.createElement(Box, { width: '3%' },
          React.createElement(Text, { color: 'gray' }, index + 1)
        ),
        React.createElement(Box, { width: '35%' },
          React.createElement(Text, { color: 'white' }, accountState.email)
        ),
        React.createElement(Box, { width: '20%' },
          React.createElement(Text, { color: statusDisplay.color }, statusDisplay.text)
        ),
        React.createElement(Box, { width: '42%' },
          React.createElement(Text, { color: 'gray' }, accountState.result)
        )
      );
    }),
    
    React.createElement(Text, null, ' ')
  );
};

export default RefreshView;