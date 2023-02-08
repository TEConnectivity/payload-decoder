
function Decoder(bytes, port) {
    var decode = {}

    if (DecodeFwRevision(decode, port, bytes) === false)
        if (Decode8911EX(decode, port, bytes) === false)
            if (Decode8931EX(decode, port, bytes) === false)
                if (DecodeU8900(decode, port, bytes) === false)
                    if (Decode8911EXAlgoBatt(decode, port, bytes) === false)
                        if (DecodeU8900Pof(decode, port, bytes) === false)
                            if (DecodeSinglePoint(decode, port, bytes) === false)
                                if (DecodeOperationResponses(decode, port, bytes) === false)
                                    if (DecodeKeepAlive(decode, port, bytes) === false) {
                                        decode.val = 'Unknown frame';
                                        decode.port = port;
                                        decode.bytes = bytes.map(byte => byte.toString(16)).join('');
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
function DecodeU8900Pof(decode, port, bytes) {
    if (port == 104) {
        // MCU Flags
        decode.pream = bytes[0] == 0x3C ? 'OK' : 'KO !!!';
        decode.rst_cnt = arrayConverter(bytes, 1, 2, true);
        decode.pof_tx = bytes[3] & 0x01 == 0x01 ? 'MCU POF !!!' : 'OK';
        decode.pof_idle = (bitfield(bytes[4], 0) === 0) ? 'OK' : 'MCU POF !!!';
        decode.pof_snsmeas = (bitfield(bytes[4], 1) === 0) ? 'OK' : 'MCU POF !!!';
        decode.pof_batmeas = (bitfield(bytes[4], 2) === 0) ? 'OK' : 'MCU POF !!!';


        decode.batt = arrayConverter(bytes, 5, 2, true) + 'mV';

        if (bytes[7] === 0x00) {
            decode.devstat = 'ok';
        }
        else {
            decode.devstat = {};
            decode.devstat.Meas = (bitfield(bytes[7], 7) === 0) ? 'OK' : 'err';
            decode.devstat.Cal = (bitfield(bytes[7], 6) === 0) ? 'OK' : 'err';
            decode.devstat.Unk = (bitfield(bytes[7], 5) === 0) ? 'OK' : 'err';
            decode.devstat.Unsup = (bitfield(bytes[7], 4) === 0) ? 'OK' : 'err';
        }

        decode.batt_lvl = (bytes[8] & 0x0F) == 0xF ? 'ERROR' : (((bytes[8] & 0x0F) * 10) + '%');
        decode.patbatt = bytes[9] == 0xA5 ? 'OK' : 'Corrupted';
        decode.pattemp = bytes[9] == 0xA5 ? 'OK' : 'Corrupted';

        decode.mcu_temp = arrayConverter(bytes, 10, 2, true, true) / 100.0 + '°C';
        decode.pres = isNaN(arrayToFloat(bytes, 13)) ? 'ERROR' : round(arrayToFloat(bytes, 13), 3) + ' Bar';
        decode.patend = bytes[17] == 0x5A ? 'OK' : 'KO !!! ';
        var i = 0;
        decode.zdata = [];
        for (i = 0; i < bytes.length; i++) {
            decode.zdata.push(bytes[i].toString(16));
        }
        return true;
    }
    return false;
     }
     //port 10  EyEALQhjCgw/gHNj  1321002d08630a0c3f807363    data
     //port 20  AComZGU4ZWFiMTdhZDVm  00 2a 26 64 65 38 65 61 62 31 37 61 64 35 66 fw rev
    //port 30  /EyEARwhj keep alive 132100470863
function DecodeOperationResponses(decode, port, bytes) {
         var res = false;
         if (port == 20) {
             res = true;
             var OperationRepsType = {
                 0: "Read",
                 1: "Write",
                 2: "Write+Read"
             }
             var OperationFlag = {
                 7: "UuidUnk",
                 6: "OpErr",
                 5: "ReadOnly",
                 4: "NetwErr",

             }
             decode.op = OperationRepsType[bytes[0]&0x3];
             decode.opFlag = [];
             for (var i = 7; i > 4; i--) {
                 if (bitfield(bytes[0], i) === 1) {
                     decode.opFlag.push(OperationFlag[i]);
                 }
             }
                 var uuid = arrayToUint16(bytes, 1, false)
                 decode.uuid = uuid.toString(16);
                 var payload = bytes.slice(3)
                 switch (uuid) {
                     case 0x2A24:
                         decode.model = arrayToAscii(payload);
                         break;
                     case 0x2A25:
                         decode.sn = arrayToAscii(payload);
                         break;
                     case 0x2A26:
                         decode.fwrev = arrayToAscii(payload);
                         break;
                     case 0x2A27:
                         decode.hwrev = arrayToAscii(payload);
                         break;
                     case 0x2A29:
                         decode.manuf = arrayToAscii(payload);
                         break;
                     case 0xB302:
                         decode.measInt = payload[0].toString() + 'h '+payload[1].toString() + ' min'+payload[2].toString() + ' sec';
                            break;
                     default:
                         decode.payload = []
                         for (var i = 0; i < payload.length; i++) {
                             decode.payload.push(payload[i].toString(16));
                         }
                         break;
                 }

             
         }
         else {
             res = false;
         }
         return res;
     }
function DecodeKeepAlive(decode, port, bytes) {
         if (port == 30) {
             decode.msgType = "Keep Alive";
             decode.devtype = {}
             decode.devtype = getDevtype(arrayToUint16(bytes, 0, false));
             decode.cnt = arrayToUint16(bytes, 2, false, false);
             decode.devstat = []
             decode.devstat = getDevstat(bytes[4])
             decode.bat = bytes[5];
            
             return true;
         }
         else {
             return false;
         }
     }
function DecodeSinglePoint(decode, port, bytes) {
    if (port == 10 ) {
        decode.devtype = {}
        decode.devtype = getDevtype(arrayToUint16(bytes, 0, false));
        decode.cnt = arrayToUint16(bytes, 2, false, false);
        decode.devstat = []
        decode.devstat = getDevstat(bytes[4])
        decode.bat = bytes[5];

        decode.temp = (arrayConverter(bytes, 6, 2, false, true) / 100.0).toString() + "°C";
        if (decode.devtype.Output == "Float") {
                decode.data = (arrayToFloat(bytes, 8, false)).toString() + decode.devtype.Unit;
         }
            else {
                decode.data = (arrayToInt32(bytes, 8, false) / 100.0).toString() + decode.devtype.Unit;
        }

        return true;
    }
    return false;
}
function getDevstat(u8devstat) {
    var devstat;
    devstat = [];
    var DevstatDict = {
        7: "SnsErr",
        6: "CfgErr",
        5: "MiscErr",
        4: "Condition",
        3: "PrelPhase"
    }

    if (u8devstat === 0x00) {
        devstat.ok = 'ok';
    }
    else {
       
        for (var i = 7; i >= 3; i--) {
            if (bitfield(u8devstat, i) === 1) {
                devstat.push(DevstatDict[i]);
            }
        }
    }
    return devstat;
         }
function getDevtype(u16devtype) {
    var devtype = {};

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
    devtype.Platform = SwPlatformDict[((u16devtype >> 12) & 0x0F)];
    devtype.Sensor = SensorDict[((u16devtype >> 8) & 0x0F)];
    devtype.Wireless = WirelessDict[((u16devtype >> 4) & 0x0F)];
    devtype.Output = OutputDict[(u16devtype & 0x0F)];
    devtype.Unit = SensorUnitDict[((u16devtype >> 8) & 0x0F)];
    return devtype;
}

function arrayToAscii(arr, offset=0, size = arr.length - offset) {
    var text = ''
    for (var i = 0; i < size; i++) {
        text += String.fromCharCode(arr[i + offset]);
    }
    return text
}
function round(value, decimal) {
    return Math.round(value * Math.pow(10, decimal)) / Math.pow(10, decimal);

}
function hexToFloat(hex) {
    var s = hex >> 31 ? -1 : 1;
    var e = (hex >> 23) & 0xFF;
    return s * (hex & 0x7fffff | 0x800000) * 1.0 / Math.pow(2, 23) * Math.pow(2, (e - 127))
}
function arrayToUint32(arr, offset, littleEndian = true) {
    return (arrayConverter(arr, offset, 4, littleEndian, false));
}
function arrayToUint16(arr, offset, littleEndian = true) {
    return (arrayConverter(arr, offset, 2, littleEndian,false));
}
function arrayToInt32(arr, offset, littleEndian = true) {
    return (arrayConverter(arr, offset, 4, littleEndian, true));
}
function arrayToInt16(arr, offset, littleEndian = true) {
    return (arrayConverter(arr, offset, 2, littleEndian, true));
}
function arrayToFloatOld(arr, offset, littleEndian = true) {
    return hexToFloat(arrayConverter(arr, offset, 4, littleEndian,false));
}

function arrayToFloat(arr, offset, littleEndian = true) {
    let view = new DataView(new ArrayBuffer(4));
    for (let i = offset; i < offset+ 4; i++) {
        view.setUint8(i, arr[i]);
    }
    return view.getFloat32(0, littleEndian);
}


function arrayConverter(arr, offset, size, littleEndian = true, isSigned = false) {
    var outputval = 0;
    for (var i = 0; i < size; i++) {
        if (littleEndian == false) {
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

