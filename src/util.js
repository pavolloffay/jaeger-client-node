// @flow
// Copyright (c) 2016 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import * as thrift from './thrift.js';
import xorshift from 'xorshift';
import Int64 from 'node-int64';

export default class Utils {

    static startsWith(text: string, prefix: string): boolean {
        return text.indexOf(prefix) === 0;
    }

    static getRandom64(): ArrayBuffer {
        let randint = xorshift.randomint();
        let buf = Buffer(8);
        buf.writeUInt32BE(randint[0], 0);
        buf.writeUInt32BE(randint[1], 4);
        return buf;
    }

    // The type is any to allow polymorphism, but this function really takes string or number.
    static encodeInt64(numberValue: any): any {
        if (numberValue === '-1') {
            // when -1 is passed as a string to Int64
            // it becomes a 32 bit written into a 64 bit 
            // which makes it positive.  This is bad so
            // we fix it here.
            let buffer: any = new Buffer(8);
            buffer.writeUInt32LE(-1 << 32, 0);
            return buffer;
        }

        return new Int64(numberValue).toBuffer();
    }

    static ipToInt(ip: string): number {
        let ipl = 0;
        let parts = ip.split('.');
        for (let i = 0; i < parts.length; i++) {
            ipl <<= 8;
            ipl += parseInt(parts[i], 10);
        }
        // todo(oibe) prove that this will never be grater than 2^31 because
        // zipkin core thrift complains
        return ipl;
    }


    static createEndpoint(serviceName: string , ipv4: any, port: number): Endpoint {
        if (ipv4 === 'localhost') {
            ipv4 = '127.0.0.1';
        }

        return {
            ipv4: Utils.ipToInt(ipv4),
            port: port || 0,
            serviceName: serviceName
        };
    }

    static createBinaryAnnotation(
            key: string,
            value: any,
            annotationType: string,
            host?: Endpoint): BinaryAnnotation {

        return {
            key: key,
            value: new Buffer(value, 'binary'),
            annotationType: annotationType,
            host: host
        };
    }

    static createIntegerTag(key: string, value: number): BinaryAnnotation {
        let max_16 = 0x7fff;
        let min_16 = -0x7fff - 1;
        let max_32 = 0x7fffffff;
        let min_32 = -0x7fffffff - 1;

        let type;
        let buf;
        if (value < min_32 || value > max_32) {
            type = thrift.annotationType.I64;
            buf = Utils.encodeInt64(value, 0);
        } else if (value < min_16 || value > max_16) {
            type = thrift.annotationType.I32;
            buf = new Buffer(4);
            buf.writeInt32BE(value, 0);
        } else {
            type = thrift.annotationType.I16;
            buf = new Buffer(2);
            buf.writeInt16BE(value, 0);
        }

        return this.createBinaryAnnotation(key, value, type);
    }

    static createAnnotation(timestamp: number, value: string , host: Endpoint) {
        return {
            timestamp: timestamp,
            value: value,
            host: host
        };
    }

    static createLogData(timestamp, name, host) {
            return this.createAnnotation(timestamp, name, host);
    }


    static createBooleanTag(key: string, value: boolean): BinaryAnnotation {
        let booleanValue = '0x0';
        if (value) {
            booleanValue = '0x01';
        }

        return this.createBinaryAnnotation(key, booleanValue, thrift.annotationType.BOOL);
    }

    static createStringTag(key: string, value: string): BinaryAnnotation {
        return this.createBinaryAnnotation(key, value, thrift.annotationType.STRING);
    }

    static getTimestamp(): number {
        return Date.now() * 1000;
    }

}
