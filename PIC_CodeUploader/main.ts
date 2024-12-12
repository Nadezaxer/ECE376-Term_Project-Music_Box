import { stdout } from "process";
import { SerialPort } from "serialport";
import { readFile, readFileSync, watch } from "fs";
import { exec } from "child_process";

const port = new SerialPort({
    path: '/dev/ttyUSB0', //Forced
    baudRate: 9600, // Forced
    autoOpen: false
});

port.on("open", (err) => {
    if (err) {
        console.log(err);
    }
    let [width, height] = stdout.getWindowSize();
    let message = "Serial Port Opened";
    message = "\n<" + "=".repeat(Math.floor((width - message.length) / 2) - 2) +" "+ message +" "+ "=".repeat(Math.ceil((width - message.length) / 2) - 2) + ">";
    console.log(message);
})

const resetString =
    `rev 02.24.17 Offset=0x800\r\n>\r\n3`;

let endStringMatch = "";

let filePath = __dirname + "/../C_Code/main.hex"
let fileData: Buffer;

port.on("data", (data) => {
    endStringMatch = endStringMatch.concat(data.toString())
    endStringMatch = endStringMatch.slice(-resetString.length, endStringMatch.length);

    if (resetString === endStringMatch) {
        port.write(" ");
        port.drain((err) => {
            if (err)
                console.log(err)
            setTimeout(() => {
                fileData = readFileSync(filePath);
                port.write(fileData, () => {
                    console.log("<======== Code Uploaded ========>")
                })
            }, 2000);
        })
    }
});

port.on("close", () => {
    let [width, height] = stdout.getWindowSize();
    let message = "Serial Port Closed";
    message = "\n<" + "=".repeat(Math.floor((width - message.length) / 2) - 2) +" "+ message +" "+ "=".repeat(Math.ceil((width - message.length) / 2) - 2) + ">";
    console.log(message);
})

setInterval(() => {
    if (!port.isOpen) {
        port.open((err) => {});
    }
}, 1000)

port
port.pipe(stdout);