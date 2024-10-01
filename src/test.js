//const puppeteer = require('puppeteer');
import puppeteer from "puppeteer";
// import fs from "fs"
import * as fs from 'fs/promises';
// const fs = require('fs');

///// IMPORTANT INFO - If you want to add new website, you must first initialize it in the Data.json file with empty values.
// Also need to change max_websites and add it in urls array///

// Iterations
const itr = 5;
const last_itr = itr;
const max_websites = 6;

let k = 0;
let j = 0;

// URLs
const urls = ["https://foxnews.com", "https://reddit.com", "https://wikipedia.com", "https://apple.com",
  "https://yelp.com", "https://pinterest.com"];

// Initialize variables with 0 values
let iter = 0;
let tot_duration = 0;
let resource_timing = 0;
let redirect_time = 0;
let worker = 0;
let DNS = 0;
let TCP = 0;
let request = 0;
let RTT = 0;
let response = 0;
let DOM = 0;
let DOM_load = 0;
let load_event = 0;
let cache_time = 0;
let tot_transfer_size = 0;


// Read the existing JSON file // Function
async function readJsonFile() {
  try {
    const data = await fs.readFile('./Data.json', 'utf8');
    const jsonData = JSON.parse(data);
    return jsonData;
  } catch (err) {
    console.error('Error:', err);
    throw err; // Rethrow error for further handling
  }
}

const jsonData = await readJsonFile();

(async () => {

  for (let i = 1; i <= itr; i++) {

    // Website URL
    if (k > urls.length) {
      k = 0;
    }
    const web_url = urls[k];

    for (j ; j < max_websites; j++) {
      if (web_url === jsonData.Websites[j].Website) {
        iter = jsonData.Websites[j].Iterations;
        tot_duration = jsonData.Websites[j].Data["Total Duration"][0];
        resource_timing = jsonData.Websites[j].Data["Resource Time"][0];
        redirect_time = jsonData.Websites[j].Data["Redirect Time"][0];
        worker = jsonData.Websites[j].Data["Worker Time"][0];
        DNS = jsonData.Websites[j].Data["DNS Lookup"][0];
        TCP = jsonData.Websites[j].Data["TCP Handshake"][0];
        request = jsonData.Websites[j].Data["Request Time"][0];
        RTT = jsonData.Websites[j].Data["Typical RTT"][0];
        response = jsonData.Websites[j].Data["Response Time"][0];
        DOM = jsonData.Websites[j].Data["DOM Time"][0];
        DOM_load = jsonData.Websites[j].Data["DOM Content Load"][0];
        load_event = jsonData.Websites[j].Data["Load Event Time"][0];
        cache_time = jsonData.Websites[j].Data["Cache Time"][0];
        tot_transfer_size = jsonData.Websites[j].Data["Transfer Size"][0];
        break
      }
    }

    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--incognito',
        '--disable-quic'
      ]
    });

    const [ page ] = await browser.pages();
    // const page = await browser.newPage();

    // Disable cache
    await page.setCacheEnabled(false);
    // Delete cookie
    await page.deleteCookie();

    // Clear cookies
    const client = await page.createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');

    // Navigate to the page
    await page.goto(web_url);
    //await page.goto(web_url, { waitUntil: 'networkidle0' });

    // RECOMMENDED
    const metric_vals = await page.evaluate(() => {
      const performanceEntries = performance.getEntriesByType('navigation')[0];
      localStorage.clear();
      sessionStorage.clear();
      return JSON.stringify(performanceEntries);
    });

    const parsed_metric_vals = JSON.parse(metric_vals);

    // All values
    const duration = parsed_metric_vals.duration;
    const startTime = parsed_metric_vals.startTime;
    const redirectStart = parsed_metric_vals.redirectStart;
    const redirectEnd = parsed_metric_vals.redirectEnd;
    const workerStart = parsed_metric_vals.workerStart;
    const fetchStart = parsed_metric_vals.fetchStart;
    const domainLookupStart = parsed_metric_vals.domainLookupStart;
    const domainLookupEnd = parsed_metric_vals.domainLookupEnd;
    const connectStart = parsed_metric_vals.connectStart;
    const connectEnd = parsed_metric_vals.connectEnd;
    const requestStart = parsed_metric_vals.requestStart;
    const responseStart = parsed_metric_vals.responseStart;
    const responseEnd = parsed_metric_vals.responseEnd;
    const domInteractive = parsed_metric_vals.domInteractive;
    const domContentLoadedEventStart = parsed_metric_vals.domContentLoadedEventStart;
    const domContentLoadedEventEnd = parsed_metric_vals.domContentLoadedEventEnd;
    const domComplete = parsed_metric_vals.domComplete;
    const loadEventStart = parsed_metric_vals.loadEventStart;
    const loadEventEnd = parsed_metric_vals.loadEventEnd;
    const transferSize = parsed_metric_vals.transferSize;

    // Total duration from beginning to end
    tot_duration = duration + tot_duration;
    // Resource timing from beginning to response end
    resource_timing = (responseEnd - startTime) + resource_timing;
    // Redirect
    redirect_time = (redirectEnd - redirectStart) + redirect_time;
    // Worker
    worker = (fetchStart - workerStart) + worker;
    // DNS
    DNS = (domainLookupEnd - domainLookupStart) + DNS;
    // TCP Handshake
    TCP = (connectEnd - connectStart) + TCP;
    // Request-Response
    request = (responseStart - requestStart) + request;
    // Typical RTT
    RTT = (responseEnd - requestStart) + RTT;
    // Response
    response = (responseEnd - responseStart) + response;
    // DOM
    DOM = (domComplete - domInteractive) + DOM;
    // DOM Load
    DOM_load = (domContentLoadedEventEnd - domContentLoadedEventStart) + DOM_load;
    // Load Render
    load_event = (loadEventEnd - loadEventStart) + load_event;
    // Cache Time
    cache_time = (domainLookupStart - fetchStart) + cache_time;
    // Transfer Size
    tot_transfer_size = transferSize + tot_transfer_size;

    console.log(parsed_metric_vals);

    await page.close();
    await browser.close();

    // Update JSON in-memory object every iteration
    jsonData.Websites[j].Iterations = iter + 1;
    jsonData.Websites[j].Data["Total Duration"][0] = tot_duration;
    jsonData.Websites[j].Data["Resource Time"][0] = resource_timing;
    jsonData.Websites[j].Data["Redirect Time"][0] = redirect_time;
    jsonData.Websites[j].Data["Worker Time"][0] = worker;
    jsonData.Websites[j].Data["DNS Lookup"][0] = DNS;
    jsonData.Websites[j].Data["TCP Handshake"][0] = TCP;
    jsonData.Websites[j].Data["Request Time"][0] = request;
    jsonData.Websites[j].Data["Typical RTT"][0] = RTT;
    jsonData.Websites[j].Data["Response Time"][0] = response;
    jsonData.Websites[j].Data["DOM Time"][0] = DOM;
    jsonData.Websites[j].Data["DOM Content Load"][0] = DOM_load;
    jsonData.Websites[j].Data["Load Event Time"][0] = load_event;
    jsonData.Websites[j].Data["Cache Time"][0] = cache_time;
    jsonData.Websites[j].Data["Transfer Size"][0] = tot_transfer_size;

    // update k webpage counter
    k++;

    if (i === last_itr) {
      for (let l = 0; l < max_websites; l++) {
        if (jsonData.Websites[l].Iterations > 0) {
          jsonData.Websites[l].Data["Total Duration"][1] = (jsonData.Websites[l].Data["Total Duration"][0] / jsonData.Websites[l].Iterations);
          jsonData.Websites[l].Data["Resource Time"][1] = (jsonData.Websites[l].Data["Resource Time"][0] / jsonData.Websites[l].Iterations);
          jsonData.Websites[l].Data["Redirect Time"][1] = (jsonData.Websites[l].Data["Redirect Time"][0] / jsonData.Websites[l].Iterations);
          jsonData.Websites[l].Data["Worker Time"][1] = (jsonData.Websites[l].Data["Worker Time"][0] / jsonData.Websites[l].Iterations);
          jsonData.Websites[l].Data["DNS Lookup"][1] = (jsonData.Websites[l].Data["DNS Lookup"][0] / jsonData.Websites[l].Iterations);
          jsonData.Websites[l].Data["TCP Handshake"][1] = (jsonData.Websites[l].Data["TCP Handshake"][0] / jsonData.Websites[l].Iterations);
          jsonData.Websites[l].Data["Request Time"][1] = (jsonData.Websites[l].Data["Request Time"][0] / jsonData.Websites[l].Iterations);
          jsonData.Websites[l].Data["Typical RTT"][1] = (jsonData.Websites[l].Data["Typical RTT"][0] / jsonData.Websites[l].Iterations);
          jsonData.Websites[l].Data["Response Time"][1] = (jsonData.Websites[l].Data["Response Time"][0] / jsonData.Websites[l].Iterations);
          jsonData.Websites[l].Data["DOM Time"][1] = (jsonData.Websites[l].Data["DOM Time"][0] / jsonData.Websites[l].Iterations);
          jsonData.Websites[l].Data["DOM Content Load"][1] = (jsonData.Websites[l].Data["DOM Content Load"][0] / jsonData.Websites[l].Iterations);
          jsonData.Websites[l].Data["Load Event Time"][1] = (jsonData.Websites[l].Data["Load Event Time"][0] / jsonData.Websites[l].Iterations);
          jsonData.Websites[l].Data["Cache Time"][1] = (jsonData.Websites[l].Data["Cache Time"][0] / jsonData.Websites[l].Iterations);
          jsonData.Websites[l].Data["Transfer Size"][1] = (jsonData.Websites[l].Data["Transfer Size"][0] / jsonData.Websites[l].Iterations);
        }
      }
    }

  }  // for loop end

    // Convert the data to a JSON string with formatting
    const updatedJsonData = JSON.stringify(jsonData, null, 2);

    // Write the JSON string to a file
    fs.writeFile('./Data.json', updatedJsonData, (err) => {
      if (err) {
        console.error('Error writing to file', err);
      } else {
        console.log('Performance data saved to Data.json');
      }
    });

})();
