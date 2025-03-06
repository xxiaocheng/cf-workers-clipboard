# Multi-Device Clipboard Sync

A Cloudflare Worker-based application that allows users to synchronize text content across multiple devices. Automatically generated using Cursor.

*[中文文档](README.zh-CN.md)*

## Features

- **Password Protection**: Create or join a sync group by entering the same password
- **Real-time Synchronization**: Content entered on one device is instantly synced to all devices using the same password
- **History Records**: Maintains a history of all synchronized content
- **Responsive Design**: Adapts to various device screen sizes
- **Security**: Passwords must contain letters, numbers, and be at least 13 characters long
- **Lazy Loading**: Supports pagination for loading large history records

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (using Vue.js framework)
- **Backend**: Cloudflare Worker
- **Data Storage**: Cloudflare KV Storage

## Quick Deployment

### Prerequisites

1. Install [Node.js](https://nodejs.org/) (version 14 or higher)
2. Have a Cloudflare account

### Deployment Steps

1. Clone this repository:
   ```
   git clone https://github.com/xxiaocheng/cf-workers-clipboard.git
   cd cf-workers-clipboard
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Log in to your Cloudflare account:
   ```
   npx wrangler login
   ```

4. Create a KV namespace:
   ```
   npx wrangler kv:namespace create "CLIPBOARD_DATA"
   ```

5. Add the generated KV namespace ID to the `wrangler.toml` file:
   ```
   # Edit the wrangler.toml file, replace the placeholder with the ID generated in the previous step
   ```

6. Deploy the Worker:
   ```
   npx wrangler publish
   ```

7. After deployment, Wrangler will provide a URL that you can use to access the application

## Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Start the local development server:
   ```
   npx wrangler dev
   ```

3. Access the application in your browser at `http://localhost:8787`

## Usage Instructions

1. Open the application URL
2. Enter a strong password (at least 13 characters, including letters and numbers)
3. If the password is newly created, the system will create a new sync group
4. If the password already exists, you will join the corresponding sync group
5. Enter text content in the input box and send
6. All devices using the same password will receive the synchronized content

## Troubleshooting

### 1. Command Not Found Error

If you encounter a `command not found: wrangler` error, use `npx` to run wrangler commands:

```
npx wrangler <command>
```

### 2. "Not Found" Error After Deployment

If the page displays "Not Found" after deployment, it may be due to:

- Routing configuration issues in the Worker code
- Static resources not properly initialized

Solutions:
- Ensure the routes in the `index.js` file are correctly handled
- Check that the configuration in the `wrangler.toml` file is correct
- Try redeploying the Worker

### 3. KV Storage Issues

If you encounter KV storage-related issues, you can view the current keys in the KV storage by accessing the `/debug` path:

```
https://your-worker-url.workers.dev/debug
```

## Future Plans

- Support for image, video, and file synchronization
- Add end-to-end encryption
- Support for content expiration time settings
- Add more customization options

## License

MIT 