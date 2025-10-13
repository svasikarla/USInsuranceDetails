# Supabase MCP Server Setup Guide

This guide will help you set up Model Context Protocol (MCP) servers to allow Claude Code to directly access your Supabase database.

## Prerequisites

- Node.js and npm installed
- Supabase account with active project
- Claude Code or Claude Desktop installed
- Your Supabase credentials

## Option 1: Official Supabase MCP Server (Recommended)

The official Supabase MCP server provides full project management capabilities.

### Step 1: Get Your Supabase Access Token

1. Go to https://supabase.com/dashboard/account/tokens
2. Click "Generate New Token"
3. Give it a name like "MCP Server Access"
4. Copy the token (starts with `sbp_`)

### Step 2: Configure MCP Server

Add this configuration to your VSCode settings.json (or Claude Desktop config):

**Location**: `C:\Users\user\AppData\Roaming\Code\User\settings.json`

```json
{
  "mcp": {
    "servers": {
      "supabase": {
        "command": "npx",
        "args": [
          "-y",
          "@supabase-community/supabase-mcp"
        ],
        "env": {
          "SUPABASE_ACCESS_TOKEN": "YOUR_SUPABASE_ACCESS_TOKEN_HERE",
          "SUPABASE_PROJECT_REF": "pkiztedrylfvymdowtno"
        }
      }
    }
  }
}
```

### Step 3: Replace with Your Credentials

Replace `YOUR_SUPABASE_ACCESS_TOKEN_HERE` with your actual token from Step 1.

The project ref is already filled in: `pkiztedrylfvymdowtno`

### Step 4: Restart Claude Code

After saving the settings, restart VSCode/Claude Code to activate the MCP server.

---

## Option 2: PostgreSQL MCP Server (Direct Database Access)

This option gives direct SQL access to your PostgreSQL database.

### Configuration

Add this to your settings.json:

```json
{
  "mcp": {
    "servers": {
      "postgres": {
        "command": "npx",
        "args": [
          "-y",
          "@modelcontextprotocol/server-postgres",
          "postgresql://postgres.pkiztedrylfvymdowtno:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
        ]
      }
    }
  }
}
```

**IMPORTANT**: Replace `YOUR_PASSWORD` with your actual database password.

You can find the correct connection string in your Supabase dashboard:
- Go to Project Settings → Database
- Copy the "Connection string" under "Connection pooling"
- Use the URI format (not the individual parameters)

---

## Option 3: Both Servers (Recommended for Full Access)

You can configure both servers for maximum flexibility:

```json
{
  "mcp": {
    "servers": {
      "supabase": {
        "command": "npx",
        "args": ["-y", "@supabase-community/supabase-mcp"],
        "env": {
          "SUPABASE_ACCESS_TOKEN": "YOUR_SUPABASE_ACCESS_TOKEN",
          "SUPABASE_PROJECT_REF": "pkiztedrylfvymdowtno"
        }
      },
      "postgres": {
        "command": "npx",
        "args": [
          "-y",
          "@modelcontextprotocol/server-postgres",
          "postgresql://postgres.pkiztedrylfvymdowtno:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
        ]
      }
    }
  }
}
```

---

## What This Enables

Once configured, Claude Code will be able to:

### With Supabase MCP Server:
- ✅ Query database schemas and tables
- ✅ Execute SQL queries
- ✅ Manage database migrations
- ✅ View and modify RLS policies
- ✅ Manage authentication settings
- ✅ Trigger serverless functions
- ✅ Manage project configuration

### With PostgreSQL MCP Server:
- ✅ Direct SQL query execution
- ✅ Schema inspection
- ✅ Read/write access to tables
- ✅ Performance analysis

---

## Security Considerations

### Important Notes:
1. **Never commit MCP configurations with credentials to version control**
2. The MCP server has full access to your Supabase project
3. For production, consider using read-only mode:
   ```json
   "env": {
     "SUPABASE_ACCESS_TOKEN": "your_token",
     "SUPABASE_PROJECT_REF": "your_ref",
     "READ_ONLY": "true"
   }
   ```

### Read-Only PostgreSQL Configuration:
To make the PostgreSQL connection read-only, create a read-only user in Supabase:

```sql
-- Run this in your Supabase SQL Editor
CREATE USER readonly_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE postgres TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;
```

Then use that user's credentials in the connection string.

---

## Troubleshooting

### MCP Server Not Appearing
1. Restart VSCode/Claude Code completely
2. Check that Node.js and npx are in your PATH
3. Verify the JSON syntax is correct (no trailing commas)

### Connection Failures
1. Verify your access token is valid
2. Check that the project ref is correct
3. Ensure your database password is correct
4. Test the connection string manually using `psql` or a database client

### Permission Errors
1. Make sure your access token has the required permissions
2. Check RLS policies aren't blocking access
3. Verify your database user has the necessary grants

---

## Testing the Connection

After setup, you can test by asking Claude Code:

1. "Can you list all tables in my Supabase database?"
2. "Show me the schema for the users table"
3. "What RLS policies are on the users table?"
4. "Run a query to count all records in the policies table"

---

## Next Steps

Once the MCP server is configured:
1. Claude can help fix the RLS infinite recursion issue
2. Verify and correct the DATABASE_URL password
3. Audit and improve database security
4. Optimize queries and indexes
5. Set up proper user roles and permissions

---

## Need Help?

If you encounter issues:
1. Check the Claude Code logs for error messages
2. Verify credentials in Supabase dashboard
3. Test connection with a database client first
4. Ensure firewall isn't blocking connections
