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

import xorshift from 'xorshift';
import Int64 from 'node-int64';

export default class Utils {

    static getRandom64(): ArrayBuffer {
        let randint: any = xorshift.ranomint();
        let buf: ArrayBuffer = new ArrayBuffer(8);
        let dataview: DataView = new DataView(buf);
        dataview.setUint32(0, randint[0], false);
        dataview.setUint32(4, randint[1], false);
        return buf;
    }

    static encodeInt64(numberValue: string) {
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

}
