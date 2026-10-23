# Install CleanFrame on a Samsung The Frame (no AI needed)

This is a checklist for one person with one laptop. It uses Samsung's official tools. It does not change the TV's native Home settings.

**Time:** about one hour. **You need:**
- A laptop on the same Wi-Fi network as the TV.
- A Samsung account. Sign in only in Samsung's own sign-in window.
- The TV remote.
- Three values from your private card: `<TV_IP>`, `<LAPTOP_IP>` and `<DUID>`.

Do not put these values in a public place. Do not commit certificates, passwords or `.wgt` files.

## Before you start

- This app is not the same as the app on the maintainer's TV. It has its own ID: `svFrameHm1.CleanFrame` (package `svFrameHm1`).
- It was tested in a browser preview only. It has not run on a TV.
- Home shortcuts use app IDs read from another TV. Some apps may not exist on yours.
- The Sources tab and the Luna, Xbox and Boosteroid games are untested on a TV.

## Step 1. Find the laptop's IP address

- **Mac:** open Terminal and run `ipconfig getifaddr en0`. If it prints nothing, use System Settings > Wi-Fi > Details.
- **Windows:** open Command Prompt and run `ipconfig`. Use the IPv4 address of the Wi-Fi adapter.

Ignore VPN addresses. This is `<LAPTOP_IP>`. It must start with the same first three numbers as `<TV_IP>`.

## Step 2. Turn on Developer Mode on the TV

1. Open **Home > Apps > App Settings**.
2. Press the **123** button on the remote to show the number pad. Some remotes share this button.
3. Enter **1 2 3 4 5**. Select Done if it shows.
4. In the popup, set Developer Mode to **On**.
5. Enter `<LAPTOP_IP>` as Host PC IP. Save.
6. Restart the TV when it asks.

Check the connection from the laptop:

- **Mac or Linux:** `nc -z -G 3 <TV_IP> 26101 && echo open`
- **Windows (PowerShell):** `Test-NetConnection <TV_IP> -Port 26101`

If the port stays closed:
1. Check the Host PC IP on the TV. One wrong digit blocks the connection.
2. Switch off at the wall for ten seconds, then restore power. Never do this during a TV update.
3. Check again.

Port 8001 answering does not prove Developer Mode works. Only port 26101 counts.

## Step 3. Install Tizen Studio

1. Download Tizen Studio from Samsung: https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html
2. Open **Package Manager**. Install these:
   - Main SDK: the web application tools (Web CLI).
   - Extension SDK: **TV Extensions** and **Samsung Certificate Extension**.
3. Restart Tizen Studio.

If the installer asks for Java, follow its prompt.

## Step 4. Connect the TV in Device Manager

1. Open **Tools > Device Manager**.
2. Select **Remote Device Manager**, then **+**.
3. Enter a name, `<TV_IP>` and port **26101**. Select Add.
4. Switch the **Connection** toggle to On.
5. Check that the TV shows its Tizen version and CPU type. Write both down.

If the connection fails, go back to Step 2.

## Step 5. Create the certificates

1. Open **Tools > Certificate Manager**. Select **+**.
2. Choose **Samsung**, then **TV**. Enter a profile name, for example `CleanFrameTV`.
3. Create a **new author certificate**. Enter your name and a password. Sign in to your Samsung account when asked.
4. Create the **distributor certificate**. Choose privilege level **Public**.
5. Add your TV's device ID. Pick the connected TV from the list. This is the safest way.
6. If you must type it, type `<DUID>` and check every character. The DUID is the **Unique Device ID**. The "Unique ID" on the same screen is a different value.
7. Finish. Make sure the profile holds both certificates.
8. Make this profile the active one.
9. Copy the certificate folder to a private backup. You need the same author certificate for every update.

## Step 6. Open the project

1. Get the code: `git clone https://github.com/svintit/CleanFrame`
2. In Tizen Studio, choose **File > Import > Tizen > Tizen Project**.
3. Select the **`app`** folder inside the clone. Finish.
4. Open `config.xml`. Check that it shows `svFrameHm1.CleanFrame`.

## Step 7. Build the signed package

1. Right-click the project. Choose **Build Signed Package**.
2. Find the new `.wgt` file in the project folder.
3. If the build says no profile is active, return to Step 5 and set one.

## Step 8. Install on the TV

1. In Device Manager, right-click the TV. Choose **Permit to install applications**. Use your profile.
2. Right-click the project. Choose **Run As > Tizen Web Application**.
3. Look for **CleanFrame** in the TV's app list.

If the install fails:
- **A privilege error.** Open `app/config.xml` and remove the line for `tv.window`. Build again. The Sources tab may then not switch inputs.
- **A certificate error.** Check that the distributor certificate holds the right device ID.
- **The transfer stalls, or the app does not show.** Read the "Two failures to avoid" note in `docs/agent-tv-setup-guide.md`. It describes the `vd_appinstall` step.

## Step 9. Check it on the TV

1. Open CleanFrame from the TV's app list.
2. Move through the Apps, Games and Sources tabs with the remote.
3. Open two apps you own, for example YouTube and Netflix.
4. Press Home. You must reach Samsung's own Home screen.

Write down anything that looks wrong. Send a photo of the screen to whoever maintains the project.

## Stop here

Home button routing is a separate task. It uses undocumented commands and needs its own backup and approval. Do not try it from this checklist.

To remove the app: open the TV's Apps screen, select CleanFrame and delete it.

## Later updates

Each UI change needs a new signed package. Use the **same author certificate**. Keep the certificate backup safe.
