import server from "./server.js";
import os from "os";

const networkInterfaces = os.networkInterfaces();
let privateAddress = "";

// Iterate through the network interfaces
for (const name in networkInterfaces) {
  for (const iface of networkInterfaces[name]) {
    // Filter out internal addresses and use only IPv4 addresses
    if (iface.family === "IPv4" && !iface.internal) {
      privateAddress = iface.address;
      break;
    }
  }
}

const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log(`Server is Running on http://${privateAddress}:${port}`);
});
