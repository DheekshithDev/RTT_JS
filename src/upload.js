import puppeteer from "puppeteer";
import fs from "fs"
import path from 'path';

// Iterations
const itr = 50;

let avg_upload_time = 0;

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
        '--disable-extensions'

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

    // Wait for upload selector field
    await page.waitForSelector('input[type=file]');

    // Inject performance marks and measure code into the page
    await page.evaluate(() => {
      // Clear previous marks and measures
      performance.clearMarks();
      performance.clearMeasures();
      localStorage.clear();
      sessionStorage.clear();
    });

    // Upload the file
    const filePath = path.relative(process.cwd(), './100MB.bin');
    const fileInput = await page.$('#fileInput');
    await fileInput.uploadFile(filePath);

    // Wait for upload button
    await page.waitForSelector('#uploadButton');
    // Click the upload button
    await page.click('#uploadButton');

    // Mark start time
    await page.evaluate(() => performance.mark('upload-start'));

    // Wait for the upload to complete and mark end time
    await page.evaluate(() => {
      return new Promise((resolve) => {
        document.addEventListener('uploadCompleted', () => {
          performance.mark('upload-end');
          resolve();
        });
      });
    });

    // Measure the duration between start and end marks
    const uploadTime = await page.evaluate(() => {
      performance.measure('upload-duration', 'upload-start', 'upload-end');
      const measure = performance.getEntriesByName('upload-duration')[0];
      return measure.duration; // milliseconds
    });

    //console.log(uploadTime);

    avg_upload_time = uploadTime + avg_upload_time;

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
    avg_upload_time = (avg_upload_time / itr);
    jsonData.standard.iterations = itr;
    jsonData.standard.upload = avg_upload_time;

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
