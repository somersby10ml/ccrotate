import React from 'react';
import { Box, Text } from 'ink';

const AccountsList = ({ accounts, currentEmail }) => {
  if (accounts.length === 0) {
    return React.createElement(Box, { flexDirection: "column", marginTop: 1, marginBottom: 1 },
      React.createElement(Text, { color: "yellow" }, "No saved accounts found."),
      React.createElement(Text, { color: "blue" }, "Please login with claude-code and run `ccrotate snap` to add your first account.")
    );
  }

  const headerRow = React.createElement(Box, null,
    React.createElement(Box, { width: "4%" },
      React.createElement(Text, { bold: true, color: "gray" }, "#")
    ),
    React.createElement(Box, { width: "3%" },
      React.createElement(Text, { bold: true, color: "gray" }, "★")
    ),
    React.createElement(Box, { width: "45%" },
      React.createElement(Text, { bold: true, color: "gray" }, "Email")
    ),
    React.createElement(Box, { width: "48%" },
      React.createElement(Text, { bold: true, color: "gray" }, "Last Used")
    )
  );

  const separator = React.createElement(Box, null,
    React.createElement(Text, { color: "gray" }, '─'.repeat(80))
  );

  const accountRows = accounts.map((account, index) => {
    const isCurrent = account.email === currentEmail;
    const marker = isCurrent ? '★' : ' ';
    const markerColor = isCurrent ? 'green' : 'gray';
    const emailColor = isCurrent ? 'green' : 'white';
    
    return React.createElement(Box, { key: account.email },
      React.createElement(Box, { width: "4%" },
        React.createElement(Text, { color: "gray" }, index + 1)
      ),
      React.createElement(Box, { width: "3%" },
        React.createElement(Text, { color: markerColor }, marker)
      ),
      React.createElement(Box, { width: "45%" },
        React.createElement(Text, { color: emailColor }, account.email)
      ),
      React.createElement(Box, { width: "48%" },
        React.createElement(Text, { color: "gray" }, account.lastUsed)
      )
    );
  });

  return React.createElement(Box, { flexDirection: "column", marginTop: 1 },
    React.createElement(Text, { bold: true, color: "white" }, "📋 Saved Accounts"),
    React.createElement(Text, null, " "),
    headerRow,
    separator,
    ...accountRows,
    React.createElement(Text, null, " ")
  );
};

export default AccountsList;