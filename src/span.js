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

import assert from 'assert';
import * as thrift from './thrift.js';
import Utils from './util.js';
import SpanContext from './span_context.js';

export default class Span {
    _tracer: any;
    _name: string;
    _spanContext: SpanContext;
    _timestamp: number;
    _duration: number;
    _port: number;
    _isClient: boolean;
    _peer: Endpoint;
    _ended: boolean;
    _annotations: Array<Annotation>;
    _binaryAnnotations: Array<BinaryAnnotation>;

    constructor(tracer: any,
                name: string,
                spanContext: SpanContext,
                timestamp: number,
                isClient: boolean,
                peer: Endpoint,
                annotations: Array<Annotation> = [],
                binaryAnnotations: Array<BinaryAnnotation> = []
    ) {
        this._tracer = tracer;
        this._name = name;
        this._spanContext = spanContext;
        this._timestamp = timestamp;
        this._duration = 0;
        this._port = 0;
        this._isClient = isClient;
        this._peer = peer;
        this._ended = false;

        // logs
        this._annotations = annotations;

        // tags
        this._binaryAnnotations = binaryAnnotations;
    }

    context(): SpanContext {
        return this._spanContext;
    }

    tracer(): any {
        return this._tracer;
    }

    setOperationName(name: string): void {
        this._name = name;
    }

    finish(finishTime: number): void {
        assert(!this._ended, "You can only call finish() on span once");
        this._ended = true;

        if (this._spanContext.IsSampled() && this._timestamp) {
            let endTime = finishTime || Utils.getTimestamp();
            this._duration = endTime - this._timestamp;
            this.log({
                event: this._isClient ? thrift.CLIENT_RECV : thrift.SERVER_SEND,
                timestamp: endTime
            });

            this._tracer._report(this);
        }
    }

    addTags(keyValuePairs: any): void {
        if (this._spanContext.IsSampled()) {
            for (let key in keyValuePairs) {
                if (keyValuePairs.hasOwnProperty(key)) {
                    let value = keyValuePairs[key];
                    let tag;
                    if (typeof value === 'number' && (Math.floor(value) === value)) {
                        tag = Utils.createIntegerTag(key, value);
                    } else if (typeof value === 'boolean') {
                        tag = Utils.createBooleanTag(key, value);
                    } else {
                        tag = Utils.createStringTag(key, value);
                    }
                    this._binaryAnnotations.push(tag);
                }
            }
        }
    }

    log(fields: any): void {
        if (this._spanContext.IsSampled()) {
            if (!fields.timestamp) {
                fields.timestamp = Utils.getTimestamp();
            }

            if (!fields.event && !fields.payload) {
                throw new Error('log must be passed either an event of type string, or a payload of type object');
            }

            let value = fields.event || JSON.stringify(fields.payload);
            let logData = Utils.createLogData(fields.timestamp, value);

            logData.host = this._tracer._host;
            this._annotations.push(logData);
        }
    }

    _setPeer(peer: Endpoint): void {
        // codecs should set the pper
    }
}
