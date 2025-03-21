/* eslint-disable no-undef */
import { useState, useEffect } from "react";
import Papa from "papaparse";
const SearchList = () => {
  const [csvData, setCsvData] = useState("");
  const [tableSearchSheetCount, setTableSearchSheetCount] = useState(0);

  useEffect(() => {
    chrome.storage.local.get(["scrapedData"], (result) => {
      if (result.scrapedData && Array.isArray(result.scrapedData)) {
        setTableSearchSheetCount(result.scrapedData.length - 1); // Exclude header row if present
      }
    });
  }, []);

  const fetchSearchData = async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrollToBottom,
      });
  
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
        "Country"
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

        const rowData = [
          name,
          designation,
          company,
          country
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
      const csv = Papa.unparse(data, {
        encoding: "utf-8"
    });
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

    const blob = new Blob([csvData], { 
      type: "text/csv", 
      encoding: "utf-8" 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "linkedin_data.csv";
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

  const scrollToBottom = async () => {
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
          className="py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg cursor-pointer text-white"
        >
          Scrap This Table
        </button>
        <button
          onClick={unperseSearchData}
          className="py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg cursor-pointer text-white mt-3"
        >
          Convert to CSV
        </button>
        <button
          onClick={clearSearchData}
          className="py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer text-white mt-3"
        >
          Clear Data
        </button>
        <p className="my-2 text-gray-700">Total Rows: {tableSearchSheetCount}</p>

        {csvData && (
          <div className="flex flex-col gap-2">
            <button
              onClick={downloadSearchCsv}
              className="py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg cursor-pointer text-white"
            >
              Download CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchList;
