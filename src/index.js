const BucketName = 'rtt-analysis';
const bucketRegion = "us-east-2";
const IdentityPoolId = "us-east-2:4b1ff38f-07f5-4c9a-93fb-6642279a29c2";

AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId,
  }),
});

const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket: BucketName },
});


// Handle the file upload
document.getElementById('uploadButton').addEventListener('click', function() {
  const file = document.getElementById('fileInput').files[0];
  if (!file) {
    alert('Please choose a file to upload.');
    return;
  }

  const uploadParams = {
    Bucket: BucketName,
    Key: file.name, // The name of the file to be uploaded
    Body: file,
  };

  s3.upload(uploadParams, function(err, data) {
    if (err) {
      console.error('Error uploading the file:', err.message);
      alert('There was an error uploading your file. Please try again.');
    } else {
      console.log('Successfully uploaded the file:', data);

      // Event for puppeteer catch
      document.dispatchEvent(new Event('uploadCompleted')); // Custom event

      // Visual feedback: update the DOM
      const uploadStatus = document.getElementById('uploadStatus');
      uploadStatus.innerText = 'File successfully uploaded to S3.';
      uploadStatus.style.color = 'green'; // Change text color to green
    }
  });
});

// Handle the file download
document.getElementById('downloadButton').addEventListener('click', function() {
  const fileName = '100MB.bin'; // Name of the file to be downloaded

  const downloadParams = {
    Bucket: BucketName,
    Key: fileName,
  };

  s3.getObject(downloadParams, function(err, data) {
    if (err) {
      console.error('Error downloading the file:', err.message);
      alert('There was an error downloading the file. Please try again.');
    } else {
      console.log('Successfully fetched the file:', data);

      // Create a Blob from the downloaded data
      const blob = new Blob([data.Body], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);

      // Create a link element to trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Cleanup: remove the link element and revoke the object URL
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Event for puppeteer to catch
      document.dispatchEvent(new Event('downloadCompleted')); // Custom event

      // Visual feedback: update the DOM
      const downloadStatus = document.getElementById('downloadStatus');
      downloadStatus.innerText = 'File successfully downloaded from S3.';
      downloadStatus.style.color = 'blue'; // Change text color to blue
    }
  });
});


