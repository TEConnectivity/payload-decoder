
 function Decoder(bytes, port) {
    var decode = {}

     if (DecodeFwRevision(decode, port, bytes) === false)
         if (Decode8911EX(decode, port, bytes) === false)
             if (Decode8931EX(decode, port, bytes) === false)
                 if (DecodeU8900(decode, port, bytes) === false)
                     if (Decode8911EXAlgoBatt(decode, port, bytes) === false)
                         if (DecodeSinglePoint(decode, port, bytes) === false) {
                             decode.val = 'Unknown';
                             decode.port = port;
                             decode.bytes = []

                             for (i = 0; i < bytes.length; i++) {
                                 decode.bytes.push(bytes[i].toString(16));
                             }

                         }
    return decode;

}
function Decode8931EX(decode, port, bytes) {
    if (port == 5) {
        decode.bat = (bytes[1] & 0x0F) == 0xF ? 'err' : (((bytes[1] & 0x0F) * 10) + '%');

        if (bytes[0] === 0x00) {
            decode.devstat = 'ok';
        }
        else {
            decode.devstat = {};
            decode.devstat.rotEn = (bitfield(bytes[7], 7) == 1) ? 'enabled' : 'disabled';
            decode.devstat.temp = (bitfield(bytes[7], 6) === 0) ? 'ok' : 'err';
            decode.devstat.acc = (bitfield(bytes[7], 5) === 0) ? 'ok' : 'err';
        }
        decode.temp = bytes[2] * 0.5 - 40 + '°C';
        decode.fftInfo = {};
        decode.fftInfo.BwMode = bytes[3] & 0x0F;
        decode.axisInfo = {};
        decode.axisInfo.Axis = String.fromCharCode(88 + (bytes[4] >> 6));
        decode.axisInfo.PeakNb = bytes[4] & 0x3F;
        decode.axisInfo.SigRms = dBDecompression(bytes[5]);

        decode.peaksList = [];



        var peakVal = 0;
        var bitCount = 0;
        for (var i = 0; i < decode.axisInfo.PeakNb * 19; i++) {
            peakVal |= ((bytes[6 + Math.trunc((i / 8))] >> (8 - 1 - (i % 8))) & 0x01) << (19 - bitCount - 1);
            bitCount++;
            if (bitCount == 19) {

                var peak = {};
                peak.Freq = peakVal >> 8;
                peak.Mag = dBDecompression(peakVal & 0xFF);
                decode.peaksList.push(peak);
                bitCount = 0;
                peakVal = 0;
            }



        }
        return true;

    }


    else {
        return false;
    }
}
function Decode8911EX(decode, port, bytes) {
    if (port == 1 || port == 129) {
        decode.bat = bytes[0] + '%';
        decode.peak_nb = bytes[1];
        decode.temp = arrayConverter(bytes, 2, 2);
        decode.temp = decode.temp == 0x7FFF ? 'err' : round(((decode.temp / 10.0) - 100), 1);
        decode.sig_rms = round(arrayConverter(bytes, 4, 2) / 1000.0, 3);
        decode.preset = bytes[6];
        decode.devstat = {};
        if (bytes[7] === 0x00) {
            decode.devstat = 'ok';
        }
        else {
            decode.devstat.rotEn = (bitfield(bytes[7], 7) == 1) ? 'enabled' : 'disabled';
            decode.devstat.temp = (bitfield(bytes[7], 6) === 0) ? 'ok' : 'err';
            decode.devstat.acc = (bitfield(bytes[7], 5) === 0) ? 'ok' : 'err';
        }

        decode.peaks = [];
        for (var i = 0; i < decode.peak_nb; i++) {
            var peak = {};
            peak.freq = arrayConverter(bytes, 5 * i + 8, 2);
            peak.mag = round(arrayConverter(bytes, ((i * 5) + 10), 2) / 1000.0, 3);
            peak.ratio = bytes[i * 5 + 12];
            decode.peaks.push(peak);

        } return true;
    }
    return false;
}

//Preliminary
function DecodeU8900(decode, port, bytes) {
    if (port == 4) {
        decode.bat = (bytes[1] & 0x0F) == 0xF ? 'err' : (((bytes[1] & 0x0F) * 10) + '%');

        if (bytes[0] === 0x00) {
            decode.devstat = 'normal';
        }
        else {
            decode.devstat = {};
            decode.devstat.Meas = (bitfield(bytes[0], 7) === 0) ? 'ok' : 'err';
            decode.devstat.Cal = (bitfield(bytes[0], 6) === 0) ? 'ok' : 'err';
            decode.devstat.Unk = (bitfield(bytes[0], 5) === 0) ? 'ok' : 'err';
            decode.devstat.Unsup = (bitfield(bytes[0], 4) === 0) ? 'ok' : 'err';

        }
        decode.temp = (arrayConverter(bytes, 2, 2) == 0x7FFF) ? 'err' : (((arrayConverter(bytes, 2, 2, true, true)) / 10.0) + '°C');
        decode.pres = isNaN(arrayToFloat(bytes, 4)) ? 'err' : round(arrayToFloat(bytes, 4), 3) + 'Bar';
        return true;
    }
    return false;
}
//A-sample
function DecodeU8900_A(decode, port, bytes) {
    if (port == 4) {
        decode.bat = (bytes[1] & 0x0F) == 0xF ? 'err' : (((bytes[1] & 0x0F) * 10) + '%');

        if (bytes[0] === 0x00) {
            decode.devstat = 'normal';
        }
        else {
            decode.devstat = {};
            decode.devstat.Meas = (bitfield(bytes[0], 7) === 0) ? 'ok' : 'err';
            decode.devstat.Cal = (bitfield(bytes[0], 6) === 0) ? 'ok' : 'err';
            decode.devstat.Unk = (bitfield(bytes[0], 5) === 0) ? 'ok' : 'err';
            decode.devstat.Unsup = (bitfield(bytes[0], 4) === 0) ? 'ok' : 'err';

        }
        decode.temp = isNaN(arrayToFloat(bytes, 2)) ? 'err' : round(arrayToFloat(bytes, 2), 1) + '°C';
        decode.pres = isNaN(arrayToFloat(bytes, 6)) ? 'err' : round(arrayToFloat(bytes, 6), 3) + 'Bar';
        return true;
    }
    return false;
}
function Decode8911EXAlgoBatt(decode, port, bytes) {
    if (port == 101) {
        decode.test = 'Battery algo';
        decode.batt = bytes[0] + '%';
        decode.capacity = arrayToFloat(bytes, 2);
        return true;
    }
    return false;
}

function DecodeSinglePoint(decode, port, bytes) {
    if (port == 10 || port == 30) {
        decode.bat = bytes[5];


        var SwPlatformDict = {
            0: "Error",
            1: "Platform_21"
        }
        var SensorDict = {
            0: "Error",
            1: "Vibration",
            2: "Temperature",
            3: "Pressure"
        }
        var SensorUnitDict = {
            0: "Error",
            1: "g",
            2: "°C",
            3: "Bar"
        }
        var WirelessDict = {
            0: "Error",
            1: "BLE",
            2: "BLE/LoRaWAN",
        }
        var OutputDict = {
            0: "Error",
            1: "Float",
            2: "Integer"
        }
        var DevstatDict = {
            7: "SnsErr",
            6: "CfgErr",
            5: "MisxErr",
            4: "Condition",
            3: "PrelPhase"
        }
        decode.devtype = {};
        decode.devtype.Platform = SwPlatformDict[((arrayToUint16(bytes, 0,false) >> 12) & 0x0F)];
        decode.devtype.Sensor = SensorDict[((arrayToUint16(bytes, 0, false) >> 8) & 0x0F)];
        decode.devtype.Wireless = WirelessDict[((arrayToUint16(bytes, 0, false) >> 4) & 0x0F)];
        decode.devtype.Output = OutputDict[(arrayToUint16(bytes, 0, false) & 0x0F)];
        var unit = SensorUnitDict[((arrayToUint16(bytes, 0, false) >> 8) & 0x0F)];
        decode.cnt = arrayToUint16(bytes, 2,  false, false);

        if (bytes[4] === 0x00) {
            decode.devstat = 'ok';
        }
        else {
            decode.devstat = [];
            for (var i = 7; i >= 3; i--) {
                if (bitfield(bytes[4], i) === 1) {
                    decode.devstat.push( DevstatDict[i]);
                }
            }
        }
        if (port == 30) {
            decode.msgType = "Keep Alive";
        }
        else if (port == 10) {
            decode.temp = (arrayConverter(bytes, 6, 2, false, true) / 100.0).toString() + "°C";
            if (decode.devtype.Output == "Float") {
                decode.data = (arrayToFloat(bytes, 8, false)).toString() + unit;
            }
            else {
                decode.data = (arrayToInt32(bytes, 8, false) / 100.0).toString() + unit;
            }
        }
        else if (port == 20) {
            decode.msgType = "Merge data";
        }
        return true;
    }
    return false;
}



function round(value, decimal) {
    return Math.round(value * Math.pow(10, decimal)) / Math.pow(10, decimal);

}
function hexToFloat(hex) {
    var s = hex >> 31 ? -1 : 1;
    var e = (hex >> 23) & 0xFF;
    return s * (hex & 0x7fffff | 0x800000) * 1.0 / Math.pow(2, 23) * Math.pow(2, (e - 127))
}
function arrayToUint32(arr, offset, lsbfirst = true) {
    return (arrayConverter(arr, offset, 4, lsbfirst, false));
}
function arrayToUint16(arr, offset, lsbfirst = true) {
    return (arrayConverter(arr, offset, 2, lsbfirst,false));
}
function arrayToInt32(arr, offset, lsbfirst = true) {
    return (arrayConverter(arr, offset, 4, lsbfirst, true));
}
function arrayToInt16(arr, offset, lsbfirst = true) {
    return (arrayConverter(arr, offset, 2, lsbfirst, true));
}
function arrayToFloat(arr, offset, lsbfirst = true) {
    return hexToFloat(arrayConverter(arr, offset, 4, lsbfirst,false));
}
function arrayConverter(arr, offset, size, lsbfirst = true, isSigned = false) {
    var outputval = 0;
    for (var i = 0; i < size; i++) {
        if (lsbfirst == false) {
            outputval |= arr[offset + size - i - 1] << (i * 8);
        }
        else {
            outputval |= arr[i + offset] << (i * 8);
        }
    }
    if (isSigned && (Math.pow(2, (size) * 8 - 1) < outputval))
        outputval = outputval - Math.pow(2, size * 8);

    return outputval;
}
function DecodeFwRevision(decode, port, bytes) {
    if (port == 2) {
        var str = '';
        for (var i = 0; i < bytes.length; i += 1)
            str += String.fromCharCode(bytes[i]);
        decode.firmware_version = str;
        return true;
    }
    return false;
}
function bitfield(val, offset) {
    return (val >> offset) & 0x01;
}

function dBDecompression(val) {
    return Math.pow(10, ((val * 0.3149606) - 49.0298) / 20);
}

