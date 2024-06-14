# TTN Payload Formater

This repository hosts the TE Connectivity frame decoder, allowing users to decode uplink frames coming from the sensors.

## Usage

It takes as input the frame in HEX (byteArray) and the lora fPort and returns in JSON a decoded object (loosely follow [TTN output format](https://www.thethingsindustries.com/docs/integrations/payload-formatters/javascript/uplink/)) : 

```Javascript
let fPort = 10;
let decodedFrame = te_decoder([0x14,0x22,0x10,0x64,0x08,0x63,0x09,0xEE,0x00,0x00,0x0D,0x09], fPort);
console.log(decodedFrame);
```

Output : 

```
{
    "data": {
        "size": 12,
        "devtype": {
            "Platform": "Platform_21",
            "Sensor": "Humidity",
            "Wireless": "BLE/LoRaWAN",
            "Output": "Integer",
            "Unit": "%"
        },
        "cnt": 4196,
        "devstat": [
            "PrelPhase"
        ],
        "bat": 99,
        "temp": "25.42",
        "data": "33.37"
    },
    "errors": []
}
```

## Tester

Launch the tester with any HTTP server, like python3 standard module for example : 

```python3 -m http.server```


## Integration on TTN

The decoding function ```te_decode()``` has the keyword "export" to be integrable with other framework & libraries. When copied-pasted in TTN, this keyword must be deleted because TTN does not support it.
