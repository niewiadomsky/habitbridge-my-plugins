# Auto Deployment Setup

This repository is configured to automatically deploy to your server via SSH whenever you push to the `main` or `master` branch.

## How It Works

When you push changes to GitHub, the GitHub Actions workflow (`.github/workflows/deploy.yml`) will:
1. Connect to your server via SSH
2. Navigate to the deployment directory
3. Execute `git pull` to update the code

## Setup Instructions

### 1. Generate SSH Key Pair (if you don't have one)

On your local machine, generate an SSH key pair:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key
```

This creates two files:
- `~/.ssh/github_deploy_key` (private key)
- `~/.ssh/github_deploy_key.pub` (public key)

### 2. Add Public Key to Your Server

Copy the public key to your server:

```bash
ssh-copy-id -i ~/.ssh/github_deploy_key.pub user@your-server.com
```

Or manually add the content of `github_deploy_key.pub` to `~/.ssh/authorized_keys` on your server.

### 3. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SSH_HOST` | Your server hostname or IP | `example.com` or `192.168.1.100` |
| `SSH_USERNAME` | SSH username on the server | `ubuntu` or `root` |
| `SSH_PRIVATE_KEY` | Private key content | Content of `~/.ssh/github_deploy_key` |
| `SSH_PORT` | SSH port (usually 22) | `22` |
| `DEPLOY_PATH` | Path to repository on server | `/var/www/habitbridge-plugins` |

**Important:** For `SSH_PRIVATE_KEY`, copy the entire content of the private key file including the `-----BEGIN` and `-----END` lines.

### 4. Prepare Your Server

Make sure the repository is cloned on your server:

```bash
# SSH into your server
ssh user@your-server.com

# Navigate to the deployment location
cd /var/www/  # or wherever you want to deploy

# Clone the repository (first time only)
git clone https://github.com/YOUR_USERNAME/habitbridge-my-plugins.git

# Set the correct branch
cd habitbridge-my-plugins
git checkout main  # or master
```

### 5. Test the Deployment

Make a small change and push to trigger the deployment:

```bash
git add .
git commit -m "Test auto deployment"
git push origin main
```

Then check the Actions tab in your GitHub repository to see the deployment progress.

## Troubleshooting

### Permission Denied
- Ensure the public key is correctly added to `~/.ssh/authorized_keys` on the server
- Check file permissions: `chmod 600 ~/.ssh/authorized_keys` on the server

### Git Pull Fails
- Ensure the deployment path exists on the server
- Check that the user has permission to access the directory
- Verify the repository is properly initialized

### Wrong Branch
- If your main branch is named `master` instead of `main`, update the workflow file
- Or ensure the `git pull` command uses the correct branch name

## Manual Deployment

If you need to deploy manually, you can SSH into your server and run:

```bash
cd /var/www/habitbridge-my-plugins  # or your deploy path
git pull origin main
```

## Security Notes

- Never commit your private SSH key to the repository
- Use GitHub Secrets to store sensitive information
- Consider using a dedicated deployment user with limited permissions
- Regularly rotate your SSH keys

