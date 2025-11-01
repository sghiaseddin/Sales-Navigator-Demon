/* eslint-disable no-undef */
import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const SearchList = () => {
  const [csvData, setCsvData] = useState("");
  const [tableSearchSheetCount, setTableSearchSheetCount] = useState(0);

  const fetchSearchData = async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      let hasNextPage = true;

      while (hasNextPage) {

        // Wait until at least one person's name appears
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            return new Promise((resolve) => {
              const interval = setInterval(() => {
                const nameCell = document.querySelector(
                  'li.artdeco-list__item a span[data-anonymize="person-name"]'
                );
                if (nameCell && nameCell.textContent.trim() !== "") {
                  clearInterval(interval);
                  resolve(true);
                }
              }, 500);
              // Optional: timeout after 10s just in case
              setTimeout(() => {
                clearInterval(interval);
                resolve(false);
              }, 5000);
            });
          },
        });

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: scrollTopToBottom,
        });

        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait to ensure content loads

        const response = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const tableElement = document.querySelector("ol.artdeco-list");
            if (tableElement) {
              return {
                tableHTML: tableElement.outerHTML,
              };
            }
            return { tableHTML: "No table found" };
          },
        });

        const data = response[0].result;

        if (data.tableHTML !== "No table found") {
          convertSearchTableToCsv(data.tableHTML);
        }
        // Try clicking the "Next" button
        const nextClicked = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const nextBtn = Array.from(document.querySelectorAll("button"))
              .find(btn => btn.innerText.trim() === "Next" && !btn.disabled);
            if (nextBtn) {
              nextBtn.click();
              return true;
            }
            return false;
          },
        });

        hasNextPage = nextClicked[0].result;

        if (hasNextPage) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait after clicking next
        }
      }

    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  const convertSearchTableToCsv = async (tableHTML) => {
    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = tableHTML;

      const table = tempDiv.querySelector("ol.artdeco-list");
      const rows = Array.from(table.querySelectorAll("li.artdeco-list__item"));

      console.log(rows);

      const headerArray = [
        "FullName",
        "JobTitle",
        "Company",
        "Country",
        "URL"
      ];
      // Extract rows
      const dataArray = rows.map((row) => {
        const nameCell = row?.querySelector('a span[data-anonymize="person-name"]');
        const name = nameCell ? nameCell.textContent.trim() : "Name not found";

        const designationCell = row?.querySelector('div span[data-anonymize="title"]');
        const designation = designationCell ? designationCell.textContent.trim() : "Job title not found";

        const companyCell = row?.querySelector('div a[data-anonymize="company-name"]');
        const company = companyCell ? companyCell.textContent.trim() : "Company not found";

        const countryCell = row?.querySelector('div span[data-anonymize="location"]');
        const country = countryCell ? countryCell.textContent.trim() : "Country not found";

        const urlCell = row?.querySelector('div > a[data-view-name="search-results-lead-name"]');
        const leadUrl = urlCell ? urlCell.href.trim() : '';
        const cleanedUrl = 'https://linkedin.com' + leadUrl.substring(leadUrl.search('/sales/'));

        const rowData = [
          name,
          designation,
          company,
          country,
          cleanedUrl
        ];

        return rowData;
      });

      const previousData = await new Promise((resolve) => {
        chrome.storage.local.get(["scrapedData"], (result) => {
          resolve(result.scrapedData || []);
        });
      });

      const isHeaderIncluded =
        previousData.length > 0 &&
        previousData[0].every((header, index) => header === headerArray[index]);

      const combinedData = isHeaderIncluded
        ? [...previousData, ...dataArray]
        : [headerArray, ...previousData, ...dataArray];

      chrome.storage.local.set({ scrapedData: combinedData });

      setTableSearchSheetCount(combinedData.length - 1);
    } catch (error) {
      console.error("Error converting table to CSV", error);
    }
  };

  const unperseSearchData = async () => {
    const data = await new Promise((resolve) => {
      chrome.storage.local.get(["scrapedData"], (result) => {
        resolve(result.scrapedData || []);
      });
    });

    if (data.length > 0) {
      const csv = Papa.unparse(data);
      setCsvData(csv);
    } else {
      console.error("No data available to convert to CSV");
    }
  };

  const downloadSearchCsv = () => {
    if (!csvData) {
      console.error("No CSV data available for download");
      return;
    }

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "linkedin_data.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    clearData();
  };

  const downloadSearchXlsx = async () => {
    const data = await new Promise((resolve) => {
      chrome.storage.local.get(["scrapedData"], (result) => {
        resolve(result.scrapedData || []);
      });
    });

    if (!data.length) {
      console.error("No data available to convert to XLSX");
      return;
    }

    // Convert 2D array (your scrapedData) to worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Add hyperlinks to the URL column (column E) starting from row 2 (skip header)
    for (let row = 2; row <= data.length; row++) {
      const cellAddress = "E" + row;
      const cell = worksheet[cellAddress];
      if (cell && typeof cell.v === "string" && cell.v.startsWith("http")) {
        worksheet[cellAddress].l = {
          Target: worksheet[cellAddress].v,
          Tooltip: "Open in browser"
        };
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

    // Write the workbook as a blob
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });

    // Trigger download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "linkedin_data.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    clearData();
  };

  const clearSearchData = () => {
    chrome.storage.local.remove("scrapedData", () => {
      setCsvData("");
      setTableSearchSheetCount(0);
    });
  };

  const scrollTopToBottom = async () => {
    return new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 200;
      const scrollDelay = 100;
      const container = document.getElementById("search-results-container"); // Target the specific div

      if (!container) {
        console.warn("Scroll container not found!");
        resolve();
        return;
      }

      container.scrollBy(0, container.scrollHeight * (-1));

      const timer = setInterval(() => {
        const scrollHeight = container.scrollHeight;
        container.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - container.clientHeight) {
          clearInterval(timer);
          setTimeout(resolve, 1000);
        }
      }, scrollDelay);
    });
  };


  return (
    <div className="p-2 space-y-3">
      <h1 className="text-medium text-sm flex gap-2 items-center justify-center">
        <span className="h-1 w-1 rounded-full bg-black"></span>
        <span>
          Scrap data from{" "}
          <a
            href="https://www.linkedin.com/sales/search/people"
            target="_blank"
            className="text-purple-400 underline font-medium"
          >
            Search List
          </a>{" "}
        </span>
      </h1>
      <div className="flex flex-col text-center">
        <button
          onClick={fetchSearchData}
          className="py-2 px-4 bg-purple-600 rounded-lg cursor-pointer text-white"
        >
          Scrap This Table
        </button>
        <button
          onClick={unperseSearchData}
          className="py-2 px-4 bg-purple-600 rounded-lg cursor-pointer text-white mt-3"
        >
          Convert to CSV & XLSX
        </button>
        <button
          onClick={clearSearchData}
          className="py-2 px-4 bg-red-600 rounded-lg cursor-pointer text-white mt-3"
        >
          Clear Data
        </button>
        <p className="my-2 text-gray-700">Search List Total Rows: {tableSearchSheetCount}</p>

        {csvData && (
          <div className="flex flex-col gap-2">
            <button
              onClick={downloadSearchCsv}
              className="py-2 px-4 bg-green-600 rounded-lg cursor-pointer text-white"
            >
              Download CSV
            </button>
            <button
              onClick={downloadSearchXlsx}
              className="py-2 px-4 bg-blue-600 rounded-lg cursor-pointer text-white"
            >
              Download XLSX
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchList;
