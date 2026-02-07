# 🌐 Google Sheets API Setup Guide

Follow these steps to connect your **Sto. Niño Portal System 2** to the live Google Sheet.

---

## Step 1: Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the **Project Dropdown** at the top left (next to the Google Cloud logo).
3. Select **"New Project"**.
4. Name it `Sto-Nino-Portal` and click **Create**.
5. **Important:** Make sure you select this new project in the dropdown menu after creating it.

## Step 2: Enable the Sheets API
1. In the search bar at the very top, type **"Google Sheets API"**.
2. Click on the result (Marketplace).
3. Click the blue **"Enable"** button.
4. *(Optional)* Click the search bar again, type **"Google Drive API"**, and enable that too.

## Step 3: Create the Service Account (The Bot)
1. Go to **"IAM & Admin"** > **"Service Accounts"** in the left sidebar menu.
2. Click **"+ Create Service Account"** (top center).
3. **Service account name**: `sheets-manager`
4. Click **Create and Continue**.
5. You can skip the "Grant this service account access" steps. Just click **Done**.

## Step 4: Create & Download the Key
1. You should now be on the list of Service Accounts. Find the `sheets-manager` row.
2. Click on the blue **Email address link** for that account (e.g., `sheets-manager@...`).
3. Look at the row of tabs near the top (Details, Permissions, Keys, Metrics). Click **"Keys"**.
4. Click the **"Add Key"** dropdown button > **"Create new key"**.
5. Select **JSON** and click **Create**.
6. A file will download. **Rename this file immediately to:** `credentials.json`

## Step 5: Place the file in the Project
1. Take the `credentials.json` file you just renamed.
2. Move it into this exact folder in your project:
   `system2/backend/credentials.json`

## Step 6: Share the Google Sheet with the Bot
1. Open the `credentials.json` file on your computer (you can use Notepad or a code editor).
2. Look for the line that says `"client_email"`. It will look like this:
   `"client_email": "sheets-manager@sto-nino-portal.iam.gserviceaccount.com"`
3. **Copy that email address** (without the quotes).
4. Go to your [Google Sheet](https://docs.google.com/spreadsheets/d/1ynlb3Qc7IarBP9bHDwSmHCdd4zFwuHPRE_Y4ujDeY0M/edit).
5. Click the big **Share** button (top right).
6. Paste the email address into the box.
7. **Important:** Make sure the permission on the right is set to **"Editor"**.
8. Uncheck "Notify people" (optional) and click **Share** or **Send**.