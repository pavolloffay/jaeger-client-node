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
import * as constants from './constants.js';
import myLocalIp from 'my-local-ip';
import NoopReporter from './reporters/noop_reporter.js';
import NoopSampler from './samplers/noop_sampler.js';
import pjson from '../package.json';
import Span from './span.js';
import SpanContext from './span_context.js';
import * as thrift from './thrift.js';
import Utils from './util.js';

export default class Tracer {
    _serviceName: string;
    _reporter: Reporter;
    _sampler: Sampler;
    _host: Endpoint;
    _tracerTags: any;
    _logger: any;

    constructor(serviceName: string,
            reporter: Reporter,
            sampler: Sampler,
            logger: any,
            port: number  = 0,
            tracerTags: any = {}) {

        tracerTags.jaegerClient = `Node-${pjson.version}`;
        this._tracerTags = tracerTags
        this._serviceName = serviceName;
        this._reporter = reporter || new NoopReporter();
        this._sampler = sampler || new NoopSampler();
        this._logger = logger;
        this._host = Utils.createEndpoint(serviceName, myLocalIp(), port);
    }

    _createSpan(operationName: string,
                spanContext: SpanContext,
                isClient: boolean,
                peer: Endpoint): Span {

        let span = new Span(
            this,
            operationName,
            spanContext,
            Utils.getTimestamp(),
            isClient,
            peer
        );

        span.log({
            'event': isClient ? thrift.CLIENT_SEND : thrift.SERVER_RECV,
            'timestamp': span._timestamp
        });

        return span;
    }

    _report(span: Span): void {
        span.addTags(this._tracerTags);
        this._reporter.report(span);
    }

    startSpan(fields: spanFields): Span {
        let randomId = Utils.getRandom64();
        let isClient = fields.isClient || !!fields.childOf || false ;
        let flags = 0;

        if (this._sampler.isSampled()) {
            flags = constants.SAMPLED_MASK;
        }

        let spanContext;
        if (fields.childOf) {
            spanContext = new SpanContext(
                fields.childOf.traceId,
                randomId,
                fields.childOf.spanId,
                fields.childOf.flags
            );
        } else {
            spanContext = new SpanContext(
                randomId,
                randomId,
                null,
                flags
            );
        }

        // todo(oibe) in the new model how will the instrumentation specify the peer for
        // a client, and server span?
        // todo(oibe) also make sure we can remove applyBeginOptions
        return this._createSpan(fields.operationName, spanContext, isClient, fields.peer);
    }

    inject(spanContext: SpanContext, format: string, carrier: any): void {
    }

    // todo(oibe) clairfy what this should return
    extract(format: string, carrier: any): SpanContext {
    }

    close(callback: Function): void {
    }

    flush(callback: Function): void {
    }
}
