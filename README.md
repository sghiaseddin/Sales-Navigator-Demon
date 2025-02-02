# Linkedin Sales Navigator Scraper

This project is a Chrome extension designed to scrape data from LinkedIn's Sales Navigator. It extracts relevant information such as names, profile URLs, industries, employee counts, and more, and allows users to download the data in CSV format. The extension is built using React and leverages Chrome's scripting and storage APIs for data extraction and management.

## Features

- **Scrape Account Data**: Extract detailed information from LinkedIn's Sales Navigator Account pages, including names, profile URLs, industries, employee counts, and more.
- **Scrape Lead List Data**: Extract data from LinkedIn's Sales Navigator Lead List pages, including names, profile URLs, designations, and outreach activities.
- **CSV Export**: Convert scraped data into CSV format for easy analysis and storage.
- **Chrome Storage Integration**: Save scraped data locally within the Chrome browser for later retrieval.
- **User-Friendly Interface**: Simple and intuitive UI for easy navigation and operation.

## Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/qtecsolution/Linkedin-Sales-Navigator-Scraper.git
   cd Linkedin-Sales-Navigator

   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Build the Extension**:

   ```bash
   npm run build
   ```

## Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked** and select the `dist` directory from the project.

## Usage

1. **Navigate to LinkedIn**:
   - Open LinkedIn Sales Navigator and navigate to either the **Account** or **Lead List** page you wish to scrape.

2. **Scrape Data**:
   - Click on the extension icon in the Chrome toolbar.
   - Select either **Scrap This Table** for Account data or **Scrap This Table** for Lead List data.
   - Ensure you scroll to the bottom of the page to load all data before scraping.

3. **Download CSV**:
   - After scraping, click **Download CSV** to save the data to your computer.

4. **Clear Data**:
   - Use the **Clear Data** button to remove all scraped data from the extension's storage.

## Contribute

We welcome contributions from the community! Here’s how you can help:

1. **Fork the Repository**:
   - Fork the project on GitHub.

2. **Create a Branch**:
   - Create a new branch for your feature or bug fix.
   ```bash
   git checkout -b feature/your-feature-name

3. **Submit a Pull Request**:
   - Open a pull request from your branch to the main repository. Provide a detailed description of your changes.