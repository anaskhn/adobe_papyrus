const express = require('express')
const app = express()
const cors = require('cors')
let converter = require('json-2-csv');
const { log } = require('console');
const axios = require('axios')
const fs = require('fs')
const { exec } = require('child_process');

app.use(cors())

const AUTHORIZATION = "Bearer eyJhbGciOiJSUzI1NiIsIng1dSI6Imltc19uYTEta2V5LWF0LTEuY2VyIiwia2lkIjoiaW1zX25hMS1rZXktYXQtMSIsIml0dCI6ImF0In0.eyJpZCI6IjE2ODc2MzE0NDIxNjNfNTg4MWJmMzMtYzcwZi00MGI3LTg0ZGYtNzNjNDI3NTBlNjQ1X3VlMSIsIm9yZyI6IjA3QjgxRUJDNjQ4OUY2QkUwQTQ5NUNDNEBBZG9iZU9yZyIsInR5cGUiOiJhY2Nlc3NfdG9rZW4iLCJjbGllbnRfaWQiOiIwZjk2ZjkzNGI2YzU0YzQ5OTEyNTFiNjNiYjUzMTgzNCIsInVzZXJfaWQiOiIwQ0U0MURFQTY0OEFBMzg5MEE0OTVGOTRAdGVjaGFjY3QuYWRvYmUuY29tIiwiYXMiOiJpbXMtbmExIiwiYWFfaWQiOiIwQ0U0MURFQTY0OEFBMzg5MEE0OTVGOTRAdGVjaGFjY3QuYWRvYmUuY29tIiwiY3RwIjozLCJtb2kiOiJjZWNkMzdhZCIsImV4cGlyZXNfaW4iOiI4NjQwMDAwMCIsImNyZWF0ZWRfYXQiOiIxNjg3NjMxNDQyMTYzIiwic2NvcGUiOiJvcGVuaWQsRENBUEksQWRvYmVJRCJ9.GLgCCRZzB7-isz4dIOp8v_DNyk4Mt8ous1MqwmZ7ASuq1TL-UrGXJQ-UZGYXKgYJmgE36THSRxyDCAnyvuafJDVEkyjy9ZG0Rwd5kV7MR-oNpWIFzVenwQyrlaM9zkm773xWx5s4i92zW0c5-KW3UrBPxe3-BOuPsKNvT-hfVFB1p75B_XWtjEjUvcxw3RO0ktW5wVzhe8j6GV1IQHggsUtIzZ3hylBuDa7nIpzwPml3RsfvyDNZgkRKesJblDUGQfiSuC3FMbOroq1DgP8HADViy0Ij434DzkaRwBsBMinXpiI8MOPr2vf-1o9KWCS9EHPfL6sQ6GqZIgYlNZ8g4w"

const X_API_KEY = "0f96f934b6c54c4991251b63bb531834"

let assetID, uploadUri, location;

axios.post("https://pdf-services-ue1.adobe.io/assets",{
    "mediaType": "application/pdf"
},{
        headers: {
            "Authorization": AUTHORIZATION,
        "x-api-key": X_API_KEY
        }
}).then((res)=>{
    assetID = res.data.assetID
    uploadUri = res.data.uploadUri
    //console.log(uploadUri);
    const file = fs.readFileSync("output1.pdf");
    axios.put(uploadUri,file,{
        headers: {
            "content-type": "application/pdf"
        }
    }).then((res)=>{
       // console.log(assetID);
        axios.post('https://pdf-services-ue1.adobe.io/operation/extractpdf',
        {
            "assetID": assetID,
            "getCharBounds": "false",
            "includeStyling": "false",
            "elementsToExtract": [
              "text",
              "tables"
            ],
            "tableOutputFormat": "xlsx",
            "renditionsToExtract": [
              "tables",
              "figures"
            ]
          },{
            headers: {
                "Authorization": AUTHORIZATION,
                "x-api-key": X_API_KEY,
                "content-type": "application/json"
            }
          }).then((res)=>{
            location = res.headers.location
            //console.log(location);
            axios.get(location,{
                headers: {
                    "Authorization": AUTHORIZATION,
                    "x-api-key": X_API_KEY,
                }
            }).then((res)=>{
                let status = res.data.status
                let downloadUri = res.data.content?.downloadUri
                const intervalId = setInterval(()=>{
                    axios.get(location,{
                        headers: {
                            "Authorization": AUTHORIZATION,
                            "x-api-key": X_API_KEY,
                        }
                    }).then((res)=>{
                       status = res.data.status
                       downloadUri = res.data.content?.downloadUri
                       if(status === 'done'){
                        console.log(downloadUri)
                        clearInterval(intervalId)
                        // Replace 'python_script.py' with the actual path to your Python script
                        const pythonScriptPath = 'script.py';

                        // Command to open a new terminal and execute the Python script with the link as an argument
                        let terminalCommand = '';
                        if (process.platform === 'win32') {
                            terminalCommand = `start cmd.exe /K python ${pythonScriptPath} "${downloadUri}"`;
                        } else {
                            terminalCommand = `open -a Terminal.app "python3 ${pythonScriptPath} ${downloadUri}"`;
                        }

                        // Execute the terminal command
                        exec(terminalCommand, (error, stdout, stderr) => {
                            if (error) {
                            console.error(`Error executing the terminal command: ${error.message}`);
                            return;
                            }
                            if (stderr) {
                            console.error(`Error output from the terminal command: ${stderr}`);
                            return;
                            }
                            console.log(`Terminal command executed successfully. ${stdout}`);
                        });
                       }
                    }).catch((err)=>{
                        console.log(err);
                    })
                },2000)
                
            }).catch((err)=>{
                console.log(err);
            })
          }).catch((err)=>{
            console.log(err);
          })
    }).catch((err)=>{
        console.log(err);
    })
}).catch((err)=>{
    console.log(err);
})

app.listen(5000,()=>{
    console.log("Server is running on port 5000")
})