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

declare var it;
import * as constants from './constants.js';
import Utils from './util.js';
import Int64 from 'node-int64';

export default class SpanContext {
    _traceId: any;
    _spanId: any;
    _parentId: any;
    _flags: number;
    _baggage: any;
    _baggageHeaderCache: any;

    constructor(traceId: any,
                spanId: any,
                parentId: any,
                flags: number) {
        this._traceId = traceId;
        this._spanId = spanId;
        this._parentId = parentId;
        this._flags = flags;
        this._baggage = {};
        this._baggageHeaderCache = {};
    }

    get traceId(): any {
        return this._traceId;
    }

    get spanId(): any {
        return this._spanId;
    }

    get parentId(): any {
        return this._parentId;
    }

    get flags(): number {
        return this._flags;
    }

    _normalizeBaggageKey(key: string) {
        if (key in this._baggageHeaderCache) {
            return this._baggageHeaderCache[key];
        }

        // This stackoverflow claims this approach is slower than regex
        // http://stackoverflow.com/questions/1144783/replacing-all-occurrences-of-a-string-in-javascript
        let normalizedKey: string = key.toLowerCase().split('_').join('-');
        // jshint validthis:false
        //
        // jshint validthis:true
        if (Object.keys(this._baggageHeaderCache).length < 100) {
            this._baggageHeaderCache[key] = normalizedKey;
        }
        // jshint validthis:false

        return normalizedKey;
    }

    setBaggageItem(key: string, value: string): void {
        let normalizedKey = this._normalizeBaggageKey(key);
        this._baggage[normalizedKey] = value;
    }

    getBaggageItem(key: string): string {
        let normalizedKey = this._normalizeBaggageKey(key);
        return this._baggage[normalizedKey];
    }

    IsSampled() {
        return !!(this.flags & constants.SAMPLED_MASK);
    }

    toString() {
        // assume id's are buffers its creator's responsibility to make them that
        var parentId = this._parentId ? this._parentId.toString('hex') : '0';

        return [
            this._traceId.toString('hex'),
            this._spanId.toString('hex'),
            parentId,
            this._flags.toString(16)
        ].join(':');
    }

    static fromString(serializedString: string): any {
        var bufferValueOne: any = Utils.encodeInt64(1);

        let headers:  any = serializedString.split(':');
        if (headers.length !== 4) {
            return null;
        }

        // TODO: eliminate this try/catch by verifying data here before calling
        // encodeInt64; any other source of thrown error here is a programming
        // error, and should not be caught at this level.
        let traceId: any = Utils.encodeInt64(headers[0]);
        let spanId: any = Utils.encodeInt64(headers[1]);
        let parentId: any = headers[2];
        let flags: number = parseInt(headers[3], 16);

        let convertedParentId: any = null;
        if (!(parentId === '0') && !(parentId === '0000000000000000')) {
            convertedParentId = Utils.encodeInt64(parentId);
        }

        return new SpanContext(
                    traceId,
                    spanId,
                    convertedParentId,
                    flags
                );
    }
}
