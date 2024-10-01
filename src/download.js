import puppeteer from "puppeteer";
import fs from "fs"

// Iterations
const itr = 50;

let avg_download_time = 0;

// Website URL
const web_url = "https://d3kvoglf1begop.cloudfront.net";

const use_tor = '--proxy-server=socks5://127.0.0.1:9050';


(async () => {

  for (let i = 1; i <= itr; i++) {
    // NEED TO CHANGE HERE TO TOR IF USING TOR
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--incognito',
        '--disable-quic',
        '--disable-extensions',
        use_tor
      ]
    });

    const [ page ] = await browser.pages();
    // const page = await browser.newPage();

    // Disable cache
    await page.setCacheEnabled(false);
    // Delete cookie
    await page.deleteCookie();

    // Navigate to the page
    await page.goto(web_url);

    // Inject performance marks and measure code into the page
    await page.evaluate(() => {
      // Clear previous marks and measures
      performance.clearMarks();
      performance.clearMeasures();
      localStorage.clear();
      sessionStorage.clear();
    });

    // Wait for download button
    await page.waitForSelector('#downloadButton');

    // Click the download button
    await page.click('#downloadButton');

    // Mark start time
    await page.evaluate(() => performance.mark('download-start'));

    // Wait for the download to complete and mark end time
    await page.evaluate(() => {
      return new Promise((resolve) => {
        document.addEventListener('downloadCompleted', () => {
          performance.mark('download-end');
          resolve();
        });
      });
    });

    // Measure the duration between start and end marks
    const downloadTime = await page.evaluate(() => {
      performance.measure('download-duration', 'download-start', 'download-end');
      const measure = performance.getEntriesByName('download-duration')[0];
      return measure.duration; // milliseconds
    });

    //console.log(downloadTime);

    avg_download_time = downloadTime + avg_download_time;

    await page.close();
    await browser.close();

  }  // for loop end

  // Read the existing JSON file
  fs.readFile('./UploadDownloadTimes.json', 'utf8', (err, data) => {
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

    // Update the upload time under standard.upload
    // NEED TO CHANGE HERE TO TOR IF USING TOR
    avg_download_time = (avg_download_time / itr);
    jsonData.tor.iterations = itr;
    jsonData.tor.download = avg_download_time;

    // Convert the data to a JSON string with formatting
    const updatedJsonData = JSON.stringify(jsonData, null, 2);

    // Write the JSON string to a file
    fs.writeFile('./UploadDownloadTimes.json', updatedJsonData, (err) => {
      if (err) {
        console.error('Error writing to file', err);
      } else {
        console.log('Performance data saved to UploadDownloadTimes.json');
      }
    });

  });

})();
