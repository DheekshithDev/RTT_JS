//const puppeteer = require('puppeteer');
import puppeteer from "puppeteer";
import fs from "fs"
// const fs = require('fs');

// Iterations  ///////////////////////// CH//////////////////////
const itr = 100;
const last_itr = itr;

// URLs
const urls = ["https://foxnews.com", "https://reddit.com", "https://wikipedia.com", "https://apple.com",
  "https://yelp.com", "https://pinterest.com", "https://www.amazon.com/", "https://www.britannica.com/",
  "https://www.cnn.com/", "https://www.ebay.com/", "https://www.nfl.com/", "https://www.linkedin.com/",
  "https://www.target.com/", "https://www.yahoo.com/", "https://www.fandom.com/",
  "https://www.youtube.com/", "https://www.tiktok.com/"];

// Website URL
const web_url = urls[16];

// All vals to 0
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


(async () => {

  for (let i = 1; i <= itr; i++) {

    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--incognito',
        '--disable-quic',
        '--disable-extensions'
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

    page.setDefaultNavigationTimeout(200000); // 200 seconds

    // Navigate to the page
    await page.goto(web_url);

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

    // console.log(parsed_metric_vals);

    await page.close();
    await browser.close();

    // process.exit(0);

  }  // for loop end

  // Avg all values
  tot_duration = tot_duration / itr;
  resource_timing = resource_timing / itr;
  redirect_time = redirect_time / itr;
  worker = worker / itr;
  DNS = DNS / itr;
  TCP = TCP / itr;
  request = request / itr;
  RTT = RTT / itr;
  response = response / itr;
  DOM = DOM / itr;
  DOM_load = DOM_load / itr;
  load_event = load_event / itr;
  cache_time = cache_time / itr;
  tot_transfer_size = tot_transfer_size / itr;

  // Add this to JSON file
  // Create an object with all the data
  const perfMetrics = {
    "Website": web_url,
    "Iterations": itr,
    "Eth": "University Network RUWirelessSec",  ///////////// CH ///////////
    "Data": {
      "Total Duration": tot_duration,
      "Resource Time": resource_timing,
      "Redirect Time": redirect_time,
      "Worker Time": worker,
      "DNS Lookup": DNS,
      "TCP Handshake": TCP,
      "Request Time": request,
      "Typical RTT": RTT,
      "Response Time": response,
      "DOM Time": DOM,
      "DOM Content Load": DOM_load,
      "Load Event Time": load_event,
      "Cache Time": cache_time,
      "Transfer Size": tot_transfer_size
    }
  };

  // Read the existing JSON file  /////////////CH///////////////
  fs.readFile('./src/DataDirect3.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }

      // Parse the JSON data
      let jsonData;
      try {
        jsonData = JSON.parse(data);
      } catch (err) {
        console.error('Error parsing JSON:', err);
      }


    // Append the new data to the Websites array
    if (Array.isArray(jsonData.Websites)) {
      jsonData.Websites.push(perfMetrics);
    }

    // Convert the data to a JSON string with formatting
    const updatedJsonData = JSON.stringify(jsonData, null, 2);

    // Write the JSON string to a file /////////////CH////////////////
    fs.writeFile('./src/DataDirect3.json', updatedJsonData, (err) => {
      if (err) {
        console.error('Error writing to file', err);
      } else {
        console.log('Performance data saved to DataDirect3.json');   //////// CH ///////
      }
    });

  });

})();
