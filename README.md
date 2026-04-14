# Serial Validation Operations Console

This console is used to upload, manage, and validate serial numbers. It includes a web dashboard for operations and a Bajaj-compatible API for real-time validation.

## What You Can Do

- Upload serials from Excel or CSV files
- Review and edit validation status
- Delete incorrect records
- Monitor upload history and validation trends
- Validate serials via API

## Operations Dashboard

Open the web console in a browser (provided by your administrator). Main areas:

- **Dashboard**: KPIs, trends, and upload shortcut
- **Records**: Search, filter, update status, delete, or clear all
- **Upload Logs**: Audit past imports
- **Health**: API and database connectivity status

### Clearing All Data

Use **Clear data** from the header or **Clear all data** in the Records page to delete all serial records and upload logs before a re-upload.

## API Integration (Bajaj)

**Endpoint**

`POST /serialnumbervalidation.svc`

**Request Body**

```json
{
  "serialNumber": "643600000042",
  "accessKey": "YOUR_ACCESS_KEY"
}
```

**Response**

```json
{
  "responseMessage": "Valid Serial Number",
  "responseStatus": "0"
}
```

### Response Status Codes

- `0` Valid Serial Number
- `-1` Invalid Serial Number
- `-2` Invalid Access Key
- `-3` Serial Number Already Validated
- `-9` Internal Server Error

## Support

If you see unexpected results, contact your admin team with the serial number, timestamp, and the response status.
